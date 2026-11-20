# BlogSpace – Full Stack Blogging Application

BlogSpace is a full-stack blogging web application that allows users to register, log in, create, view, edit, and delete blog posts.

## Features

- User registration and login
- JWT-based authentication
- Secure password hashing using bcrypt
- Create, view, edit, and delete blog posts
- User-specific dashboard
- Protected backend API routes
- Blog search by title
- Filter blogs by category
- MongoDB database integration
- Responsive user interface

## Technologies Used

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs

## Project Structure

- `index.html` – Homepage
- `login.html` – User login
- `register.html` – User registration
- `dashboard.html` – User dashboard
- `create-blog.html` – Create blog posts
- `server.js` – Backend server and API routes
- `models/` – MongoDB models
- `js/` – Frontend JavaScript
- `css/` – Stylesheets

## How to Run the Project

1. Install Node.js.
2. Clone or download this repository.
3. Open the project folder in VS Code.
4. Install dependencies:

   `npm install`

5. Create a `.env` file and configure your MongoDB connection string and JWT secret.
6. Start the backend server:

   `node server.js`

7. Open `index.html` using Live Server.

## Security

- Passwords are hashed using bcrypt.
- JWT tokens are used for authentication.
- Protected routes restrict unauthorized access.
- Users can manage their own blog posts.

## Project

BlogSpace – Full Stack Development Project