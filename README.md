# Best Cars Dealership — Full-Stack Capstone Project

Repository name: xrwvm-fullstack_developer_capstone

Project name: Best Cars Dealership Full-Stack Application

## Project overview

Best Cars Dealership is a full-stack web application developed as the IBM Full Stack Developer Capstone Project. The application allows users to browse car dealerships, view dealership details, filter dealers by state, register and log in, view customer reviews, submit reviews, and analyze the sentiment of review text.

## Main features

- Display all car dealerships with their IDs, names, cities, addresses, ZIP codes, and states.
- Filter dealerships by state.
- View individual dealership details and customer reviews.
- Register users, authenticate login sessions, and log out.
- Submit dealership reviews with vehicle and purchase details.
- Display car makes and models.
- Analyze customer review text and return positive, negative, or neutral sentiment.
- Manage car makes and models through the Django admin interface.

## Technology stack

- Frontend: React, JavaScript, HTML, CSS, Bootstrap
- Backend: Python, Django, Node.js, Express
- Data storage: SQLite, MongoDB, JSON seed data
- Deployment: IBM Cloud Code Engine and Skills Network Labs
- CI/CD: GitHub Actions

## Repository structure

- `server/frontend/` — React application and static pages
- `server/djangoapp/` — Django application, models, views, and API routes
- `server/database/` — Node.js/Express API, MongoDB models, and seed data
- `.github/workflows/` — GitHub Actions workflow

## Project objective

The objective is to build, test, and deploy a complete dealership application that combines a responsive frontend, Django backend, dealership and review APIs, user authentication, database integration, and automated code validation.
