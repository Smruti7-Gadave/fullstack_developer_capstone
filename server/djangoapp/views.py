import json
import os
import requests
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CarModel

NODE_API = os.getenv("DEALERSHIP_API_URL", "http://127.0.0.1:3030")

def _node_get(endpoint):
    response = requests.get(f"{NODE_API}/{endpoint}", timeout=10)
    response.raise_for_status()
    return response.json()

def _sentiment(review):
    text = (review or "").lower()
    positive = ("excellent", "great", "good", "helpful", "fantastic", "smooth", "best")
    negative = ("bad", "poor", "terrible", "worst", "damaged", "slow", "rude")
    score = sum(word in text for word in positive) - sum(word in text for word in negative)
    return "positive" if score > 0 else "negative" if score < 0 else "neutral"

@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("userName", "")
    user = authenticate(request, username=username, password=data.get("password", ""))
    if user is None:
        return JsonResponse({"userName": username, "error": "Invalid credentials"}, status=401)
    login(request, user)
    return JsonResponse({"userName": username, "status": "Authenticated"})

def logout_request(request):
    logout(request)
    return JsonResponse({"status": "Logged out"})

@csrf_exempt
def registration(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("userName", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return JsonResponse({"message": "Username and password are required."}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"message": "Username already exists."}, status=409)
    user = User.objects.create_user(
        username=username, password=password,
        first_name=data.get("firstName", ""),
        last_name=data.get("lastName", ""),
        email=data.get("email", ""),
    )
    return JsonResponse({"message": "Registration successful. You can now log in.", "userName": user.username}, status=201)

def get_dealerships(request, state=None):
    try:
        endpoint = "fetchDealers" if not state or state.lower() == "all" else f"fetchDealers/{state}"
        return JsonResponse({"status": 200, "dealers": _node_get(endpoint)})
    except requests.RequestException as error:
        return JsonResponse({"status": 503, "error": str(error)}, status=503)

def get_dealer_details(request, dealer_id):
    try:
        return JsonResponse({"status": 200, "dealer": _node_get(f"fetchDealer/{dealer_id}")})
    except requests.RequestException as error:
        return JsonResponse({"status": 503, "error": str(error)}, status=503)

def get_dealer_reviews(request, dealer_id):
    try:
        reviews = _node_get(f"fetchReviews/dealer/{dealer_id}")
        for review in reviews:
            review["sentiment"] = _sentiment(review.get("review", ""))
        return JsonResponse({"status": 200, "reviews": reviews})
    except requests.RequestException as error:
        return JsonResponse({"status": 503, "error": str(error)}, status=503)

@csrf_exempt
def add_review(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"status": 400, "error": "Invalid JSON"}, status=400)
    try:
        response = requests.post(f"{NODE_API}/insert_review", json=data, timeout=10)
        response.raise_for_status()
        return JsonResponse({"status": 200, "review": response.json()})
    except requests.RequestException as error:
        return JsonResponse({"status": 503, "error": str(error)}, status=503)

def get_cars(request):
    cars = CarModel.objects.select_related("car_make").order_by("car_make__Name", "Name")
    return JsonResponse({"CarModels": [
        {"CarMake": car.car_make.Name, "CarModel": car.Name, "Year": car.Year, "Type": car.Type}
        for car in cars
    ]})
