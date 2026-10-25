from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class CarMake(models.Model):
    Name = models.CharField(max_length=100, unique=True)
    Description = models.TextField(blank=True)

    def __str__(self):
        return self.Name


class CarModel(models.Model):
    CAR_TYPES = [
        ("Sedan", "Sedan"),
        ("SUV", "SUV"),
        ("WAGON", "WAGON"),
        ("Coupe", "Coupe"),
        ("Hatchback", "Hatchback"),
        ("Convertible", "Convertible"),
        ("Truck", "Truck"),
        ("Minivan", "Minivan"),
        ("Pickup", "Pickup"),
    ]

    car_make = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name="car_models")
    Name = models.CharField(max_length=100)
    Type = models.CharField(max_length=20, choices=CAR_TYPES)
    Year = models.IntegerField(validators=[MinValueValidator(2015), MaxValueValidator(2023)])

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["car_make", "Name", "Year"], name="unique_car_model_year")
        ]

    def __str__(self):
        return f"{self.car_make.Name} {self.Name} ({self.Year})"
