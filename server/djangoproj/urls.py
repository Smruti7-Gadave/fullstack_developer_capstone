from django.contrib import admin
from djangoapp import views
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login', views.login_page, name='login_page'),
    path('register', views.register_page, name='register_page'),
    path('logout', views.logout_page, name='logout_page'),
    path('djangoapp/', include('djangoapp.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
    path('about', TemplateView.as_view(template_name='About.html')),
    path('contact', TemplateView.as_view(template_name='Contact.html')),
    re_path(r'^(?!djangoapp/|admin/|static/|media/).*$', TemplateView.as_view(template_name='index.html')),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
