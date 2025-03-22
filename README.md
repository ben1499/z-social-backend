# Z Social Backend

<p align="center">
  <img src="https://res.cloudinary.com/dfubtb083/image/upload/v1742264912/z-social/k8tuivfes1t8cppm8axb.png" alt="Z Social App screenshot" width="800"/>
</p>

<div align="center">

  ![Node.js](https://img.shields.io/badge/Node.js-18.x-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![JWT](https://img.shields.io/badge/JWT-latest-000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
  ![Cloudinary](https://img.shields.io/badge/Cloudinary-latest-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
  
  <a href="https://x-social-media.vercel.app">View Demo</a>
  ·
  <a href="https://github.com/ben1499/z-social">Frontend Repo</a>
  ·
  <a href="https://github.com/ben1499/z-social-backend/issues">Report Bug</a>
</div>

Backend for Z Social application, built with Node.js and Express, managing user authentication, media uploads, and data storage with Prisma and PostgreSQL.

## 🔗 Links

- **Live Demo:** [https://z-social-ben1499.netlify.app](https://z-social-ben1499.netlify.app)
- **Frontend Repository:** [https://github.com/ben1499/z-social](https://github.com/ben1499/z-social)

## 🚀 Technologies

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JSON Web Tokens (JWT)
- **File Uploads:** Cloudinary

## 🌟 Features

- **User Authentication:** Secure registration and login using JWT.
- **Post Management:** Create, read, update, and delete posts with media attachments.
- **Media Uploads:** Handle image and GIF uploads via Cloudinary.
- **Follow System:** Enable users to follow and unfollow others.
- **Database Management:** Efficient data handling with Prisma ORM and PostgreSQL.
- **API Security:** Protect routes and ensure secure data transactions.

## 🔧 Setup

### 1. **Clone the Repository:**

```bash
git clone git@github.com:ben1499/z-social-backend.git
cd z-social-backend
```

### 2. **Install Dependencies:**

```bash
pnpm i
```

### 3. **Configure Environment Variables:**

```
DATABASE_URL=your_database_key
FRONTEND_URL=your_frontend_url
CLOUDINARY_API_KEY=cloudinary_api_key
CLOUDINARY_SECRET_KEY=cloudinary_secret_key
JWT_SECRET=your_jwt_secret_key
URL=backend_server_url
SECRET_KEY=your_secret_key
X_API_KEY=your_x_api_key
X_SECRET_KEY=your_x_secret_key
```

### 4. **Set up the Database:**

```bash
pnpm dlx prisma migrate dev
```

### 5. **Start the Server:**

```bash
pnpm start
```

The server should now be running on <http://localhost:3000>.

## 🎯 Goals

Built to power the Z Social frontend, this backend project focuses on practicing scalable API development with Node.js and Express, database management with Prisma and PostgreSQL, media uploads via Cloudinary, and secure authentication using JWT.
