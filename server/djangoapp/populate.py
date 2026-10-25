import json
from django.conf import settings
from .models import CarMake, CarModel


def initiate():
    data_file = settings.BASE_DIR / "database" / "data" / "car_records.json"
    with open(data_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    for car in data["cars"]:
        make_name = car["make"]
        make, _ = CarMake.objects.get_or_create(
            Name=make_name,
            defaults={"Description": f"{make_name} vehicles"},
        )
        CarModel.objects.update_or_create(
            car_make=make,
            Name=car["model"],
            Year=car["year"],
            defaults={"Type": car["bodyType"]},
        )

    print(f"Imported {CarMake.objects.count()} makes and {CarModel.objects.count()} unique models.")


if __name__ == "__main__":
    initiate()
