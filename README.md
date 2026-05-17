# Cloud LMS
### Cloud-Based Learning Environment System
#### A Case Study on Hands-on Space Science Training

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18.x-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)
![BigQuery](https://img.shields.io/badge/BigQuery-ML-orange.svg)

**ШУТИС · МХТС · Компьютерын Ухааны Тэнхим**

Дипломын ажил 2026

</div>

---

##  Тухай

**Lunar Cloud LMS** нь орон зайн шинжлэх ухааны практик сургалтад зориулсан үүлэн орчинд суурилсан сургалтын системийн загвар юм. Google BigQuery дээр 9.6 сая Landsat дагуулын өгөгдөл болон 572,137 NASA Wildfire бичлэгийг ашиглан машин сургалтын загвар сургаж, сургалтын системтэй нэгтгэсэн.

### Гол онцлог

- **Cloud-Native ML** — BigQuery дээр 9.6M+ бичлэг дээр ML загвар сургах
- **JupyterHub** — Интерактив Python орчин шууд браузерт
- **NASA API** — NEO asteroid болон APOD өгөгдөл бодит цагаар
- **Role-based** — Admin, Instructor, Student үүрэгт хандалт
- **Study Cases** — Орон зайн шинжлэх ухааны практик дасгалууд
- **Certificate** — Quiz 75%+ дүнтэй дүүргэсэнд батламж олгох
- **Dark/Light Theme** — EN/MN хэл дэмжих

---

##  Архитектур

```
┌─────────────────────────────────────────────────┐
│                 LUNAR CLOUD LMS                  │
├──────────────┬──────────────┬───────────────────┤
│  Frontend    │   Backend    │   Cloud Layer     │
│  React 18    │  Node.js 18  │  Google BigQuery  │
│  TypeScript  │  Express.js  │  BigQuery ML      │
│  Vite        │  PostgreSQL  │  NASA Public Data │
│  Tailwind    │  JWT Auth    │  Landsat Index    │
└──────────────┴──────────────┴───────────────────┘
```

### Tech Stack

| Давхарга | Технологи |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 15 |
| Cloud ML | Google BigQuery ML |
| Notebook | JupyterHub, Python 3.11 |
| Auth | JWT, bcrypt |
| NASA Data | NEO API, APOD API |

---

## BigQuery ML Үр дүн

### NASA Wildfire Dataset (572,137 бичлэг)
| Үзүүлэлт | Утга |
|----------|------|
| Precision | 0.878 |
| Recall | 1.000 |
| Accuracy | **99.0%** |
| F1-Score | 0.935 |
| ROC-AUC | **0.997** |

### Landsat Satellite Dataset (9,608,135 бичлэг)
| Үзүүлэлт | Утга |
|----------|------|
| R² Score | **1.0** |
| Explained Variance | 1.0 |
| Dataset | 50 жил, 7 дагуул |

---

## Суулгах заавар

### Шаардлага

```
Node.js >= 18.x
PostgreSQL >= 15
Python >= 3.11
JupyterHub
Google Cloud акаунт (BigQuery)
```

### 1. Repository clone хийх

```bash
git clone https://github.com/YOUR_USERNAME/lunar-cloud-lms.git
cd lunar-cloud-lms
```

### 2. Frontend суулгах

```bash
npm install
```

### 3. Backend суулгах

```bash
cd server
npm install
```

### 4. Environment тохируулах

```bash
# server/.env файл үүсгэх
cp server/.env.example server/.env
```

`.env` файлыг бөглөх:

```env
DATABASE_URL=postgresql://lms_user:password@localhost:5432/lms_db
JWT_SECRET=your_jwt_secret_here
NASA_API_KEY=your_nasa_api_key
PORT=8000
```

### 5. Database үүсгэх

```bash
psql -U postgres
CREATE DATABASE lms_db;
CREATE USER lms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
```

### 6. BigQuery тохируулах

```bash
# Google Cloud credentials
mkdir -p credentials
# bigquery-key.json файлаа credentials/ хавтаст хийх
```

### 7. Системийг ажиллуулах

```bash
# Frontend (port 5173)
npm run dev

# Backend (port 8000)
cd server && npm run dev

# JupyterHub (port 8888)
jupyter notebook --port=8888 --no-browser \
  --NotebookApp.token='' \
  --NotebookApp.password='' \
  --NotebookApp.allow_origin='*'
```

---

##  Файлын бүтэц

```
lunar-cloud-lms/
├── src/                          # Frontend
│   ├── components/
│   │   ├── layout/               # Sidebar, Topbar
│   │   └── views/                # Dashboard views
│   ├── pages/
│   │   ├── CourseEnvironment.tsx # Student learning
│   │   ├── VirtualLab.tsx        # JupyterHub
│   │   ├── CloudAnalytics.tsx    # BigQuery dashboard
│   │   └── instructor/           # Instructor pages
│   ├── store/                    # Zustand state
│   └── api/                      # API calls
├── server/                       # Backend
│   └── src/
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── courses.ts
│       │   ├── bigquery.ts
│       │   ├── nasa.ts
│       │   └── submissions.ts
│       └── index.ts
├── credentials/                  # GCP keys (gitignored)
├── notebooks/                    # Jupyter notebooks
│   ├── exercise-crater-cnn.ipynb
│   ├── exercise-rf-vs-nn.ipynb
│   └── exercise-surrogate.ipynb
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD
└── README.md
```

---

##  Study Cases

### Study Case 1: AI Applications in Lunar and Planetary Science

| Хэсэг | Агуулга | Дасгал |
|-------|---------|--------|
| Part 1 | Introduction to AI in Planetary Science | Exercise 1: CNN Crater Classification |
| Part 2 | AI-Based Crater Chronology | Exercise 2: RF vs Neural Network |
| Part 3 | Volcanic Structure Detection | Exercise 3: Surrogate Model |
| Part 4 | AI Surrogate Models | — |
| Part 5 | Isotope & Terrain Classification | — |
| Part 6 | Challenges & Conclusion | — |

---

## API Endpoints

### Auth
```
POST /api/auth/register    # Бүртгүүлэх
POST /api/auth/login       # Нэвтрэх
```

### Courses
```
GET  /api/courses              # Бүх хичээл
GET  /api/courses/:id          # Хичээлийн дэлгэрэнгүй
GET  /api/courses/my-progress  # Оюутны явц
PATCH /api/courses/:id/progress # Явц шинэчлэх
```

### BigQuery
```
GET /api/bigquery/stats              # Wildfire статистик
GET /api/bigquery/wildfire           # Wildfire өгөгдөл
GET /api/bigquery/ml-results         # ML үнэлгээ
GET /api/bigquery/landsat-stats      # Landsat статистик
GET /api/bigquery/landsat-ml         # Landsat ML үнэлгээ
GET /api/bigquery/landsat-by-satellite # Дагуул бүрийн статистик
```

### NASA
```
GET /api/nasa/neo     # Near Earth Objects
GET /api/nasa/apod    # Astronomy Picture of the Day
```

---

## Хэрэглэгчийн үүрэг

| Үүрэг | Эрх |
|-------|-----|
| **Admin** | Бүх хэрэглэгч, систем удирдах |
| **Instructor** | Хичээл үүсгэх, оюутан үнэлэх |
| **Student** | Хичээл үзэх, дасгал хийх, батламж авах |

---

## Лицензи

MIT License  дэлгэрэнгүйг [LICENSE](LICENSE) файлаас үзнэ үү.

---

## Зохиогч

**Нямдоржийн Цацрал**  
ШУТИС · МХТС · Компьютерын Ухааны Тэнхим  
4-р дамжааны оюутан · 2026

**Удирдагч багш:** Б.Туяацэцэг

---

<div align="center">
  <sub>
    Дипломын ажил — ШУТИС МХТС · 2026
  </sub>
</div>
