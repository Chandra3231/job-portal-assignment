# Job Portal Assignment

A comprehensive job portal application built with Node.js, Express.js, and EJS templating engine.

## Features

- **User Authentication**: Login and registration for job seekers and companies
- **Role-based Dashboards**: Separate dashboards for admin, company, and job seeker roles
- **Job Management**: Companies can post, edit, and manage job listings
- **Job Search**: Job seekers can search and apply for jobs
- **Resume Management**: Upload and manage resumes
- **Responsive Design**: Beautiful rainbow-themed UI with responsive design

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templating, HTML5, CSS3, JavaScript
- **Database**: SQLite (via better-sqlite3)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for resume uploads
- **Styling**: Custom CSS with rainbow color scheme

## Project Structure

```
├── project/
│   ├── controllers/          # Route controllers
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   └── resumeController.js
│   ├── middleware/           # Custom middleware
│   │   └── auth.js
│   ├── models/              # Database models
│   │   └── db.js
│   ├── public/              # Static assets
│   │   ├── css/
│   │   │   └── style.css
│   │   └── uploads/         # File uploads
│   ├── routes/              # Route definitions
│   │   ├── api/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── company.js
│   │   │   ├── jobs.js
│   │   │   └── jobseeker.js
│   │   └── pages.js
│   ├── utils/               # Utility functions
│   │   └── jwt.js
│   ├── views/               # EJS templates
│   │   ├── dashboards/
│   │   ├── layout/
│   │   └── *.ejs
│   ├── index.js             # Main application file
│   └── package.json
├── server.js                # Server entry point
└── package.json
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Chandra3231/job-portal-assignment.git
   cd job-portal-assignment
   ```

2. Install dependencies:
   ```bash
   npm install
   cd project
   npm install
   ```

3. Create environment variables:
   ```bash
   # Create .env file in the root directory
   JWT_SECRET=your_jwt_secret_here
   PORT=3000
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### For Job Seekers:
1. Register as a job seeker
2. Login to access your dashboard
3. Search and browse available jobs
4. Upload your resume
5. Apply for jobs

### For Companies:
1. Register as a company
2. Login to access company dashboard
3. Post new job listings
4. Manage existing job posts
5. View applications

### For Admins:
1. Login with admin credentials
2. Access admin dashboard
3. Manage users and job listings
4. Monitor platform activity

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job (company only)
- `PUT /api/jobs/:id` - Update job (company only)
- `DELETE /api/jobs/:id` - Delete job (company only)

### User Management
- `GET /api/jobseeker/profile` - Get job seeker profile
- `PUT /api/jobseeker/profile` - Update job seeker profile
- `GET /api/company/profile` - Get company profile
- `PUT /api/company/profile` - Update company profile

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact [chandra3231@example.com](mailto:chandra3231@example.com)