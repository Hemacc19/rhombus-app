import os
import glob
import shutil
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# Auto-copy generated enterprise images to frontend public directory
try:
    brain_dir = r"C:\Users\keert\.gemini\antigravity\brain\ca45ebb8-8ff7-475a-b092-405fa4ce24dc"
    public_dir = r"f:\Rombous\frontend\public"
    os.makedirs(public_dir, exist_ok=True)
    
    banners = glob.glob(os.path.join(brain_dir, "*rhombus_hero_banner*.jpg"))
    if banners and not os.path.exists(os.path.join(public_dir, "hero_banner.jpg")):
        shutil.copyfile(banners[0], os.path.join(public_dir, "hero_banner.jpg"))
except Exception:
    pass

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/', include('jobs.urls')),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
