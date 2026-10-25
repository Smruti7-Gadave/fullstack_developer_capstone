from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="CarMake",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("Name", models.CharField(max_length=100, unique=True)),
                ("Description", models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name="CarModel",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("Type", models.CharField(choices=[("Sedan", "Sedan"), ("SUV", "SUV"), ("WAGON", "WAGON"), ("Coupe", "Coupe"), ("Hatchback", "Hatchback"), ("Convertible", "Convertible"), ("Truck", "Truck")], max_length=20)),
                ("Year", models.IntegerField(validators=[django.core.validators.MinValueValidator(2015), django.core.validators.MaxValueValidator(2023)])),
                ("Name", models.CharField(max_length=100)),
                ("car_make", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="car_models", to="djangoapp.carmake")),
            ],
        ),
        migrations.AddConstraint(
            model_name="carmodel",
            constraint=models.UniqueConstraint(fields=("car_make", "Name", "Year"), name="unique_car_model_year"),
        ),
    ]
