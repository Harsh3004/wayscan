import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, useRunOnJS } from 'react-native-worklets-core';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import {
  shouldProcessPothole,
  addDetectionToQueue,
  getQueuedCount,
  processOnline,
} from './src/services/potholeService';

// ─── TYPES & CONSTANTS ──────────────────────────────────────────────
export type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
};

// Removed global SCREEN_WIDTH to avoid Worklet undefined variables scope capture bugs

// ─── MODEL CONFIG ───────────────────────────────────────────────────
/**
 * DYNAMIC RADAR CONFIG
 */
const MODEL_INPUT_SIZE = 320;
const CONFIDENCE_THRESHOLD = 0.5; // 30% minimum confidence
const NMS_IOU_THRESHOLD = 0.5; 
const INFERENCE_FPS = 30; 
const NUM_BOXES = 2100; // Expected output tensor second dimension
const BBOX_ROWS = 4;    // Rows 0-3 are box coordinates

// Display configuration - 480x480 square view matches camera
const DISPLAY_SIZE = 480;

// Scale factor: model output (320) → display (480) = 1.5x
const MODEL_TO_DISPLAY_SCALE = DISPLAY_SIZE / MODEL_INPUT_SIZE; // 1.5

// DEBUG MODE: Set to true to test with a fixed box at center
const DEBUG_TEST_MODE = false;
const DEBUG_TEST_BOX = { x: 0, y: 0, w: 80, h: 80, conf: 0.9 };

// DEBUG: Set to true to log raw model outputs
const DEBUG_LOG_RAW = true;

const DEBUG_COORDINATE_FORMAT = 'center' as 'center' | 'corners';

// DEBUG: Choose scale mode - 'contain' (fit) or 'cover' (fill)
const DEBUG_SCALE_MODE = 'contain' as 'contain' | 'cover';

// DEBUG: Flip Y axis (some models output inverted Y)
const DEBUG_FLIP_Y = false;

// DEBUG: Flip X axis (some models output inverted X)
const DEBUG_FLIP_X = true;

// DEBUG: Log final box position to debug
const DEBUG_LOG_FINAL_BOX = true;

// DEBUG: Manual offset override for testing
const DEBUG_OFFSET_X = -300;
const DEBUG_OFFSET_Y = 0;

// ─── NMS ALGORITHM ──────────────────────────────────────────────────
function applyNMS(boxes: BoundingBox[], iouThreshold: number): BoundingBox[] {
  'worklet';
  // Sort descending by confidence
  boxes.sort((a, b) => b.conf - a.conf);

  const result: BoundingBox[] = [];

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    let keep = true;

    for (let j = 0; j < result.length; j++) {
      const resBox = result[j];
      
      // Calculate Intersection Area
      const xA = Math.max(box.x, resBox.x);
      const yA = Math.max(box.y, resBox.y);
      const xB = Math.min(box.x + box.w, resBox.x + resBox.w);
      const yB = Math.min(box.y + box.h, resBox.y + resBox.h);

      const interWidth = Math.max(0, xB - xA);
      const interHeight = Math.max(0, yB - yA);
      const interArea = interWidth * interHeight;

      if (interArea > 0) {
        // Calculate Union Area
        const boxArea = box.w * box.h;
        const resBoxArea = resBox.w * resBox.h;
        const unionArea = boxArea + resBoxArea - interArea;
        
        // Calculate IoU
        const iou = interArea / unionArea;
        if (iou > iouThreshold) {
          keep = false; // Overlaps too much with a higher confidence box! Drop it.
          break;
        }
      }
    }

    if (keep) {
      result.push(box);
    }
  }
  return result;
}

// ─── PERMISSION SCREEN ──────────────────────────────────────────────
function PermissionsScreen({
  onRequestPermission,
}: {
  onRequestPermission: () => void;
}) {
  return (
    <View style={styles.permissionContainer}>
      <Text style={styles.emoji}>📸</Text>
      <Text style={styles.title}>Camera Access Needed</Text>
      <Text style={styles.subtitle}>
        WayScan needs camera access to detect potholes while you drive.
      </Text>
      <Pressable style={styles.button} onPress={onRequestPermission}>
        <Text style={styles.buttonText}>Grant Camera Access</Text>
      </Pressable>
    </View>
  );
}

// ─── NO CAMERA DEVICE SCREEN ────────────────────────────────────────
function NoCameraDeviceScreen() {
  return (
    <View style={styles.permissionContainer}>
      <Text style={styles.emoji}>❌</Text>
      <Text style={styles.title}>No Camera Found</Text>
      <Text style={styles.subtitle}>
        This device doesn't have a back camera.
      </Text>
    </View>
  );
}

// ─── CAMERA SCREEN ──────────────────────────────────────────────────
interface CameraScreenProps {
  locationRef: React.MutableRefObject<{ latitude: number; longitude: number } | null>;
  unsyncedCount: number;
}

function CameraScreen({ locationRef, unsyncedCount }: CameraScreenProps) {
  const device = useCameraDevice('back');
  
  // Display configuration - 480x480 square view
  const DISPLAY_SIZE = 480; // Square display size
  
  // Get screen dimensions in actual pixels (not density-independent)
  const WINDOW_DIMENSIONS = Dimensions.get('window');
  const SCREEN_SCALE = WINDOW_DIMENSIONS.scale || 1;
  const SCREEN_W = WINDOW_DIMENSIONS.width * SCREEN_SCALE;
  const SCREEN_H = WINDOW_DIMENSIONS.height * SCREEN_SCALE;
  
  // Camera format: request 480x480 (square, matches display)
  const format = useCameraFormat(device, [
    { videoResolution: { width: 480, height: 480 } },
    { fps: 30 }
  ]);

  const model = useTensorflowModel(
    require('./assets/models/detect.tflite'),
    'default'
  );

  const { resize } = useResizePlugin();

  // Shared values: worklet thread → React UI thread
  const detectionCount = useSharedValue(0);
  const highestConfidence = useSharedValue(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [displayConfidence, setDisplayConfidence] = useState(0);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);

  // Wrapper so Worklet can call JS thread
  const updateBoxesJS = useRunOnJS(setBoxes, []);

  // Save pothole callback with distance filter
  const savePotholeJS = useRunOnJS(async (conf: number) => {
    const location = locationRef.current;
    if (!location) return;
    
    const { shouldProcess, reason } = await shouldProcessPothole(
      location.latitude,
      location.longitude
    );
    
    if (!shouldProcess) {
      console.log(`[Pothole] Filtered: ${reason}`);
      return;
    }
    
    await addDetectionToQueue(
      location.latitude,
      location.longitude,
      conf,
      Date.now()
    );
    console.log('[Pothole] Saved to queue');
  }, []);

  const modelState = model.state;

  // Log model info once loaded so we can see the int8 shape natively
  useEffect(() => {
    if (model.state === 'loaded' && model.model) {
      const m = model.model;
      console.log('=== NEW MODEL INFO ===');
      m.inputs.forEach((t, i) => {
        console.log(`Input[${i}]: name="${t.name}" shape=[${t.shape}] dtype=${t.dataType}`);
      });
      m.outputs.forEach((t, i) => {
        console.log(`Output[${i}]: name="${t.name}" shape=[${t.shape}] dtype=${t.dataType}`);
      });
    }
  }, [model.state]);

  // Poll shared values to update UI
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayCount(detectionCount.value);
      setDisplayConfidence(highestConfidence.value);
    }, 300);
    return () => clearInterval(interval);
  }, [detectionCount, highestConfidence]);

  /**
   * FRAME PROCESSOR — runs on worklet thread at 30fps
   *
   * Targeted for INT8 model:
   * - Shape: [1, 5, 2100]
   * - Data Type: INT8 (-128 to 127)
   * - Mapping: Row 4 is Class 0 (Pothole)
   * - Normalization: (val + 128) / 255.0
   */
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      runAtTargetFps(INFERENCE_FPS, () => {
        'worklet';

        if (model.state !== 'loaded' || model.model == null) {
          return;
        }

        try {
          // 1. Resize camera frame to 320x320 uint8
          const resized = resize(frame, {
            scale: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
            pixelFormat: 'rgb',
            dataType: 'uint8',
          });

          // 2. Run Inference
          const outputs = model.model.runSync([resized]);
          if (!outputs || outputs.length === 0) return;

          const output = outputs[0]; 
          const currentBoxes: BoundingBox[] = [];
          
          // TEST MODE: Render a fixed box at center to verify rendering works
          if (DEBUG_TEST_MODE) {
            const testBox = {
              x: 10,
              y: 100,
              w: 200,
              h: 200,
              conf: 0.9,
            };
            currentBoxes.push(testBox);
            // console.log(`[TEST] Rendered box at ${testBox.x.toFixed(0)},${testBox.y.toFixed(0)} size ${testBox.w}x${testBox.h}`);
            updateBoxesJS(currentBoxes);
            detectionCount.value = 1;
            highestConfidence.value = 90;
            return;
          }
          
          // we use a RAW integer threshold for performance
          // Raw 10 corresponds to ~54% confidence
          // const rawThreshold = 10; 

          // 3. Process detection row (Row 4)
          let maxConfInFrame = 0;
          let maxConfIndex = -1;
          
          // First pass: find the actual highest confidence
          for (let i = 0; i < NUM_BOXES; i++) {
            const confRaw = output[4 * NUM_BOXES + i] as number;
            const conf = (confRaw + 128) / 255.0;
            if (conf > maxConfInFrame) {
              maxConfInFrame = conf;
              maxConfIndex = i;
            }
          }
          
          // console.log(`[DEBUG] Max conf: ${maxConfInFrame.toFixed(3)} at index ${maxConfIndex}, threshold: ${CONFIDENCE_THRESHOLD}`);

          // Second pass: process detections above threshold
          let detectionsFound = 0;
          for (let i = 0; i < NUM_BOXES; i++) {
            const confRaw = output[4 * NUM_BOXES + i] as number;
            const cxRaw = output[0 * NUM_BOXES + i] as number;
            const cyRaw = output[1 * NUM_BOXES + i] as number;
            const wRaw = output[2 * NUM_BOXES + i] as number;
            const hRaw = output[3 * NUM_BOXES + i] as number;
            
            // Dequantize INT8 [-128..127] to Normalized [0.0..1.0]
            const cx_norm = (cxRaw + 128) / 255.0;
            const cy_norm = (cyRaw + 128) / 255.0;
            const w_norm = (wRaw + 128) / 255.0;
            const h_norm = (hRaw + 128) / 255.0;
            const conf = (confRaw + 128) / 255.0;

            // Log highest confidence detection regardless of threshold
            // if (i === 0) {
            //   console.log(`[DEBUG] Highest conf in batch: ${conf.toFixed(3)} (threshold: ${CONFIDENCE_THRESHOLD})`);
            // }

            // Use normalized confidence threshold (not raw INT8 value)
if (conf > CONFIDENCE_THRESHOLD) {
              detectionsFound++;

// ─── GEOMETRIC TRANSFORMATION ──────────────────────────
              // Apply debug configuration
              let finalX = 0;
              let finalY = 0;
              let finalW = 0;
              let finalH = 0;
              
              // Get camera frame dimensions for cover mode calculation
              const FRAME_W = frame.width;
const FRAME_H = frame.height;
               
               // DEBUG: Log raw values for first detection
               // if (DEBUG_LOG_RAW && detectionsFound === 1) {
               //   console.log(`[RAW] cxRaw=${cxRaw} cyRaw=${cyRaw} wRaw=${wRaw} hRaw=${hRaw} confRaw=${confRaw}`);
               //   console.log(`[RAW] cx_norm=${cx_norm.toFixed(3)} cy_norm=${cy_norm.toFixed(3)} w_norm=${w_norm.toFixed(3)} h_norm=${h_norm.toFixed(3)}`);
               // }
               
               if (DEBUG_COORDINATE_FORMAT === 'center') {
                 // Format A: cx, cy are center point; w, h are dimensions
                 // Simple transformation: 320 → 480 (scale 1.5x)
                 const scale = MODEL_TO_DISPLAY_SCALE;
                 
                 // if (DEBUG_LOG_RAW && detectionsFound === 1) {
                 //   console.log(`[TRANSFORM] Simple scale: ${scale}x (320→480)`);
                 // }
                
                // Transform: normalized (0-1) → pixels in 480x480 display
                const boxPixelX = cx_norm * MODEL_INPUT_SIZE * scale;
                const boxPixelY = cy_norm * MODEL_INPUT_SIZE * scale;
                const boxPixelW = w_norm * MODEL_INPUT_SIZE * scale;
                const boxPixelH = h_norm * MODEL_INPUT_SIZE * scale;
                
                // Convert center-based to corner-based
                finalX = boxPixelX - boxPixelW / 2;
                finalY = boxPixelY - boxPixelH / 2;
                finalW = boxPixelW;
                finalH = boxPixelH;
                
              } else {
                // Format B: output is two corner points (x1, y1, x2, y2)
                // Interpret as: row0=x1, row1=y1, row2=x2, row3=y2
                // Calculate scale based on mode
                let scale = 1;
                if (DEBUG_SCALE_MODE === 'contain') {
                  scale = Math.min(SCREEN_W / MODEL_INPUT_SIZE, SCREEN_H / MODEL_INPUT_SIZE);
                } else {
                  scale = SCREEN_H / MODEL_INPUT_SIZE;
                }
                
                // if (DEBUG_LOG_RAW && detectionsFound === 1) {
                //   console.log(`[TRANSFORM] Format=corners Scale=${scale.toFixed(2)} Mode=${DEBUG_SCALE_MODE}`);
                // }
                
                // Transform corner coordinates directly
                const x1 = cx_norm * MODEL_INPUT_SIZE * scale;
                const y1 = cy_norm * MODEL_INPUT_SIZE * scale;
                const x2 = w_norm * MODEL_INPUT_SIZE * scale;
                const y2 = h_norm * MODEL_INPUT_SIZE * scale;
                
                finalX = Math.min(x1, x2);
                finalY = Math.min(y1, y2);
                finalW = Math.abs(x2 - x1);
                finalH = Math.abs(y2 - y1);
              }
              
              // Clamp to display boundaries (480x480)
              finalX = Math.max(0, Math.min(finalX, DISPLAY_SIZE));
              finalY = Math.max(0, Math.min(finalY, DISPLAY_SIZE));
              finalW = Math.min(finalW, DISPLAY_SIZE - finalX);
              finalH = Math.min(finalH, DISPLAY_SIZE - finalY);

              // Log final box position
              // if (DEBUG_LOG_FINAL_BOX && detectionsFound === 1) {
              //   console.log(`[FINAL] x=${finalX.toFixed(0)} y=${finalY.toFixed(0)} w=${finalW.toFixed(0)} h=${finalH.toFixed(0)}`);
              // }

              // Skip invalid boxes
              if (finalW <= 5 || finalH <= 5) {
                continue;
              }

              currentBoxes.push({
                x: finalX,
                y: finalY,
                w: finalW,
                h: finalH,
                conf: conf,
              });
            }
          }

          // Log detection summary after processing all boxes
          // if (detectionsFound > 0) {
          //   console.log(`[DEBUG] Detections passing threshold: ${detectionsFound}`);
          // }

          // 4. Post-Process (NMS)
          const finalBoxes = applyNMS(currentBoxes, NMS_IOU_THRESHOLD);
          
          // 5. Update UI values
          let maxConf = 0;
          for (let i = 0; i < finalBoxes.length; i++) {
            if (finalBoxes[i].conf > maxConf) maxConf = finalBoxes[i].conf;
          }

          detectionCount.value = finalBoxes.length;
          highestConfidence.value = Math.round(maxConf * 100);
          updateBoxesJS(finalBoxes);

          // Save pothole to database if detected
          if (finalBoxes.length > 0 && maxConf > 0.5) {
            savePotholeJS(maxConf);
          }

        } catch (_e) {
          // Inference may skip during warm-up
        }
      });
    },
    [model, resize, SCREEN_W, SCREEN_H]
  );

  if (device == null) {
    return <NoCameraDeviceScreen />;
  }

  return (
    <View style={styles.mainContainer}>
      {/* 480x480 Camera View centered on screen */}
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.cameraPreview}
          device={device}
          format={format}
          isActive={true}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
        />
        
        {/* Bounding boxes overlay - positioned within 480x480 */}
        <View style={styles.bboxOverlay}>
          {boxes.map((box, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                borderColor: '#ef4444',
                borderWidth: 3,
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
              }}>
              <Text
                style={{
                  color: 'white',
                  backgroundColor: '#ef4444',
                  alignSelf: 'flex-start',
                  fontWeight: 'bold',
                  fontSize: 10,
                  paddingHorizontal: 4,
                }}>
                Pothole {Math.round(box.conf * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* HUD Overlay */}
      <View style={styles.hudOverlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.recBadge}>
            <Text style={styles.recDot}>●</Text>
            <Text style={styles.recLabel}>REC</Text>
          </View>
          <Text style={styles.brandText}>WayScan</Text>
          {unsyncedCount > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>{unsyncedCount}</Text>
            </View>
          )}
        </View>

        {/* Bottom HUD */}
        <View style={styles.bottomHud}>
          {/* Detection alert banner */}
          {displayCount > 0 && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>
                POTHOLE DETECTED
              </Text>
            </View>
          )}

          <View style={styles.statsRow}>
            {/* Detection count */}
            <View
              style={[
                styles.statCard,
                displayCount > 0 ? styles.statCardDanger : styles.statCardSafe,
              ]}>
              <Text
                style={[
                  styles.statValue,
                  displayCount > 0
                    ? styles.statValueDanger
                    : styles.statValueSafe,
                ]}>
                {displayCount}
              </Text>
              <Text style={styles.statLabel}>
                {displayCount === 1 ? 'Pothole' : 'Potholes'}
              </Text>
            </View>

            {/* Confidence */}
            <View
              style={[
                styles.statCard,
                displayCount > 0
                  ? styles.statCardWarning
                  : styles.statCardMuted,
              ]}>
              <Text
                style={[
                  styles.statValue,
                  displayCount > 0
                    ? styles.statValueWarning
                    : styles.statValueMuted,
                ]}>
                {displayCount > 0 ? `${displayConfidence}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Confidence</Text>
            </View>

            {/* Model indicator */}
            <View style={[styles.statCard, styles.statCardInfo]}>
              <Text style={styles.modelIndicatorDot}>
                {modelState === 'loaded' ? '🟢' : '🟡'}
              </Text>
              <Text style={styles.statLabel}>YOLOv8n</Text>
            </View>
          </View>

          {/* Status line */}
          <Text style={styles.statusText}>
            {modelState === 'loaded'
              ? displayCount > 0
                ? 'Drive carefully — road damage ahead'
                : 'Scanning road surface...'
              : 'Initializing detector...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── APP ────────────────────────────────────────────────────────────
export default function App() {
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        locationRef.current = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 5 },
          (loc) => { locationRef.current = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }; }
        );
      }
    })();
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        await processOnline(true);
      }
    });
    const countInterval = setInterval(async () => { const count = await getQueuedCount(); setUnsyncedCount(count); }, 2000);
    return () => { unsubscribe(); clearInterval(countInterval); };
  }, []);

  if (!hasCameraPermission) {
    return (
      <>
        <StatusBar style="light" />
        <PermissionsScreen onRequestPermission={requestCameraPermission} />
      </>
    );
  }

  if (hasLocationPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  if (!hasLocationPermission) {
    return (
      <>
        <StatusBar style="light" />
        <PermissionsScreen onRequestPermission={async () => { const { status } = await Location.requestForegroundPermissionsAsync(); setHasLocationPermission(status === 'granted'); }} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <CameraScreen locationRef={locationRef} unsyncedCount={unsyncedCount} />
    </>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Permission Screen
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  // Main container
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Camera container - 480x480 square
  cameraContainer: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    position: 'relative',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  bboxOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // HUD overlay (outside camera view)
  hudOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 20,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  recDot: {
    color: '#ef4444',
    fontSize: 10,
  },
  recLabel: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  brandText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },

  // Center status (loading only)
  centerStatus: {
    alignItems: 'center',
  },
  modelStatusPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  modelStatusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Bottom HUD
  bottomHud: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  alertIcon: { fontSize: 16 },
  alertText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statCardSafe: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statCardDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  statCardWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  statCardMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statValueSafe: { color: '#22c55e' },
  statValueDanger: { color: '#ef4444' },
  statValueWarning: { color: '#fbbf24' },
  statValueMuted: { color: '#555555' },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
  },
  modelIndicatorDot: {
    fontSize: 16,
    marginBottom: 2,
  },

  // Status text
  statusText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Sync badge
  syncBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
