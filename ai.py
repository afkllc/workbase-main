import requests
from datetime import datetime

API_KEY = "vka_hd8otmbFSnCu55OPX2J3suEVVU09xdo8"
CHARACTER = "me_tip"
URL = "https://api.verba.ink/v1/response"

def send_message(user_text, session_id=None):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "character": CHARACTER,
        "messages": [
            {
                "role": "user",
                "content": user_text
            }
        ]
    }

    if session_id:
        payload["session_id"] = session_id

    response = requests.post(URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()

def print_nice_response(data):
    assistant_text = data["choices"][0]["message"]["content"]
    model = data.get("model", "unknown")
    character = data.get("character", "unknown")
    session_id = data.get("session_id", "unknown")
    created = data.get("created")

    time_str = "unknown time"
    if created:
        time_str = datetime.fromtimestamp(created).strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "=" * 50)
    print(f"Assistant: {assistant_text}")
    print("-" * 50)
    print(f"Model:     {model}")
    print(f"Character: {character}")
    print(f"Session:   {session_id}")
    print(f"Time:      {time_str}")
    print("=" * 50 + "\n")

def main():
    session_id = None

    while True:
        user_text = input("You: ").strip()
        if user_text.lower() in {"exit", "quit"}:
            break

        try:
            data = send_message(user_text, session_id=session_id)
            print_nice_response(data)

            if "session_id" in data:
                session_id = data["session_id"]

        except requests.exceptions.HTTPError as e:
            print(f"\nHTTP error: {e}")
            if e.response is not None:
                print(e.response.text)
        except requests.exceptions.RequestException as e:
            print(f"\nRequest error: {e}")

if __name__ == "__main__":
    main()