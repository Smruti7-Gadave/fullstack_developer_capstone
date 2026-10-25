import json
import os
import requests
from pathlib import Path
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import render, redirect
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
    return JsonResponse({"userName": ""})

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

DATA_DIR = Path(__file__).resolve().parent.parent / "database" / "data"


def _load_json_collection(filename, collection):
    file_path = DATA_DIR / filename
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)
    return data.get(collection, [])


def get_dealerships(request, state=None):
    try:
        dealers = _load_json_collection("dealerships.json", "dealerships")

        if state and state.lower() != "all":
            dealers = [
                dealer for dealer in dealers
                if dealer.get("state", "").lower() == state.lower()
                or dealer.get("st", "").lower() == state.lower()
            ]

        return JsonResponse({"status": 200, "dealers": dealers})
    except (OSError, ValueError, KeyError) as error:
        return JsonResponse({"status": 500, "error": str(error)}, status=500)


def get_dealer_details(request, dealer_id):
    try:
        dealers = _load_json_collection("dealerships.json", "dealerships")
        dealer = [
            item for item in dealers
            if int(item.get("id", 0)) == dealer_id
        ]

        if not dealer:
            return JsonResponse(
                {"status": 404, "error": "Dealership not found"},
                status=404
            )

        return JsonResponse({"status": 200, "dealer": dealer})
    except (OSError, ValueError, KeyError) as error:
        return JsonResponse({"status": 500, "error": str(error)}, status=500)


def get_dealer_reviews(request, dealer_id):
    try:
        all_reviews = _load_json_collection("reviews.json", "reviews")
        reviews = [
            review for review in all_reviews
            if int(review.get("dealership", 0)) == dealer_id
        ]

        for review in reviews:
            review["sentiment"] = _sentiment(review.get("review", ""))

        return JsonResponse({"status": 200, "reviews": reviews})
    except (OSError, ValueError, KeyError) as error:
        return JsonResponse({"status": 500, "error": str(error)}, status=500)
@csrf_exempt
def add_review(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"status": 400, "error": "Invalid JSON"}, status=400)

    required_fields = [
        "name", "dealership", "review", "purchase",
        "purchase_date", "car_make", "car_model", "car_year"
    ]
    missing = [
        field for field in required_fields
        if data.get(field) is None or data.get(field) == ""
    ]
    if missing:
        return JsonResponse(
            {"status": 400, "error": "Missing required review fields", "missing": missing},
            status=400
        )

    try:
        dealer_id = int(data["dealership"])
        car_year = int(data["car_year"])
        reviews_path = DATA_DIR / "reviews.json"

        with open(reviews_path, "r", encoding="utf-8") as file:
            collection = json.load(file)

        reviews = collection.setdefault("reviews", [])
        next_id = max((int(item.get("id", 0)) for item in reviews), default=0) + 1

        new_review = {
            "id": next_id,
            "name": str(data["name"]).strip(),
            "dealership": dealer_id,
            "review": str(data["review"]).strip(),
            "purchase": bool(data["purchase"]),
            "purchase_date": str(data["purchase_date"]),
            "car_make": str(data["car_make"]).strip(),
            "car_model": str(data["car_model"]).strip(),
            "car_year": car_year,
            "sentiment": _sentiment(data["review"]),
        }

        if not new_review["name"] or not new_review["review"]:
            return JsonResponse(
                {"status": 400, "error": "Name and review text cannot be empty"},
                status=400
            )

        reviews.append(new_review)
        temporary_path = reviews_path.with_suffix(".json.tmp")
        with open(temporary_path, "w", encoding="utf-8") as file:
            json.dump(collection, file, ensure_ascii=False, indent=2)
        os.replace(temporary_path, reviews_path)

        return JsonResponse({"status": 200, "review": new_review})
    except (OSError, ValueError, TypeError, KeyError) as error:
        return JsonResponse({"status": 500, "error": str(error)}, status=500)

def get_cars(request):
    cars = CarModel.objects.select_related("car_make").order_by("car_make__Name", "Name")
    return JsonResponse({"CarModels": [
        {"CarMake": car.car_make.Name, "CarModel": car.Name, "Year": car.Year, "Type": car.Type}
        for car in cars
    ]})

def login_page(request):
    if request.user.is_authenticated:
        return redirect("/")
    error = ""
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("/")
        error = "Invalid username or password."
    return render(request, "login.html", {"error": error})


def register_page(request):
    if request.user.is_authenticated:
        return redirect("/")
    error = ""
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        email = request.POST.get("email", "").strip()

        if not username or not password:
            error = "Username and password are required."
        elif User.objects.filter(username=username).exists():
            error = "That username is already registered. Choose another username."
        else:
            User.objects.create_user(
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                email=email,
            )
            return redirect("/login?registered=1")

    return render(request, "register.html", {"error": error})


def logout_page(request):
    logout(request)
    return redirect("/")

