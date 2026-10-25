from django.contrib import admin
from .models import CarMake, CarModel


class CarModelInline(admin.TabularInline):
    model = CarModel
    extra = 1


@admin.register(CarMake)
class CarMakeAdmin(admin.ModelAdmin):
    list_display = ("Name", "Description")
    search_fields = ("Name",)
    inlines = [CarModelInline]


@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    list_display = ("Name", "car_make", "Type", "Year")
    list_filter = ("Type", "Year", "car_make")
    search_fields = ("Name", "car_make__Name")
