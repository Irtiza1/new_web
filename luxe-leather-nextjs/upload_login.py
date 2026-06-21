import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.local')

supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

file_path = '/Users/muhammadirtiza/.gemini/antigravity-ide/brain/f30b9ef5-38b0-4a65-af01-97fb15314806/login_hero_image_1782046110081.png'
target_path = 'platform-images/login_hero_image_new.png'

url = f"{supabase_url}/storage/v1/object/media/{target_path}"

headers = {
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "image/png"
}

with open(file_path, 'rb') as f:
    data = f.read()

print("Uploading...")
response = requests.post(url, headers=headers, data=data)

if response.status_code in [200, 201]:
    print("Success:", response.json())
else:
    print("Error:", response.status_code, response.text)
