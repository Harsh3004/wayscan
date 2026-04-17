import tensorflow as tf
import sys

print("Loading model...", flush=True)
interpreter = tf.lite.Interpreter(model_path='./assets/models/detect.tflite')
interpreter.allocate_tensors()
output_details = interpreter.get_output_details()
print("Output Params:")
for out in output_details:
    print(out['name'], out['quantization_parameters'])
