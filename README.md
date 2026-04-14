1. Clone repo
git clone <repo-url>
cd backend
(if want to create python virtual environment
python -m venv .venv
.venv/Scripts/activate
then install dependencies)

3. Install dependencies
pip install -r requirements.txt

4. Set environment variable
Create .env:
MONGO_URL=your_mongodb_url
