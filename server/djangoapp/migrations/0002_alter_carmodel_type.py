from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("djangoapp", "0001_initial")]
    operations = [
        migrations.AlterField(
            model_name="carmodel",
            name="Type",
            field=models.CharField(
                choices=[
                    ("Sedan", "Sedan"),
                    ("SUV", "SUV"),
                    ("WAGON", "WAGON"),
                    ("Coupe", "Coupe"),
                    ("Hatchback", "Hatchback"),
                    ("Convertible", "Convertible"),
                    ("Truck", "Truck"),
                    ("Minivan", "Minivan"),
                    ("Pickup", "Pickup"),
                ],
                max_length=20,
            ),
        ),
    ]
