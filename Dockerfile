FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/ ./
RUN npm install
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
WORKDIR /app/backend
EXPOSE 8000
CMD python manage.py migrate && python manage.py runserver 0.0.0.0:8000
