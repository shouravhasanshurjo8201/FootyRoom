# FootyRoom - E-Commerce Web Application

FootyRoom is a modern, containerized full-stack e-commerce web application built for football enthusiasts, featuring a high-performance Next.js frontend, a robust Express/TypeScript backend, and database orchestration, all seamlessly deployed using Docker Compose with Nginx and SSL support.

---

## 🚀 Tech Stack

### **Frontend**
*   **Framework:** Next.js 16 (App Router, Turbopack)
*   **Styling:** Tailwind CSS
*   **Icons:** React Icons (`fa6`)
*   **Language:** TypeScript

### **Backend**
*   **Runtime:** Node.js (v24-alpine)
*   **Framework:** Express.js with TypeScript
*   **Database:** MongoDB Atlas / Local MongoDB
*   **Media Storage:** Cloudinary
*   **Authentication:** JWT (JSON Web Tokens)

### **DevOps & Infrastructure**
*   **Containerization:** Docker & Multi-stage Dockerfiles
*   **Orchestration:** Docker Compose
*   **Web Server & Reverse Proxy:** Nginx
*   **SSL Security:** Let's Encrypt / Certbot

---

## 📁 Project Architecture

```text
footyroom/
├── frontend/             # Next.js 16 Frontend application
├── Backend/              # Express & TypeScript Backend API
├── nginx/                # Nginx reverse proxy configuration & SSL
└── docker-compose.yml    # Multi-container orchestration