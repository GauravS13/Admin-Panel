# Four Eyed Gems Admin Panel

A comprehensive, production-ready admin panel for Four Eyed Gems businesses built with Next.js 14, TypeScript, MongoDB, and shadcn/ui.

## 🚀 Features

### Core Features
- **Secure Authentication** - JWT-based authentication with role-based access control
- **Modern Dashboard** - Beautiful analytics dashboard with real-time data visualization
- **Inquiry Management** - Complete inquiry tracking with status management
- **Client Management** - Comprehensive client database with project tracking
- **Project Management** - Advanced project management with timelines and milestones
- **User Management** - Admin and staff account management with permissions
- **Analytics & Reports** - Detailed business intelligence and reporting
- **Activity Logging** - Complete audit trail for all admin actions

### Technical Features
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **JWT Authentication** with secure password hashing
- **Zod Validation** for client and server-side validation
- **Recharts** for data visualization
- **Responsive Design** for all devices

## 🎨 Color Palette

The application uses a custom color palette:
- **Primary**: `#4B49AC`, `#98BDFF`
- **Supporting**: `#7DA0FA`, `#7978E9`, `#F3797E`

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd it-admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-example.txt .env.local
   ```

   Configure the following variables in `.env.local`:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/it-consultancy-admin

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
   JWT_EXPIRES_IN=8h

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login Credentials

- **Email**: admin@itconsultancy.com
- **Password**: Admin123!

⚠️ **Important**: Change these credentials after first login!

## 📁 Project Structure

```
it-admin-panel/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   └── admin/            # Admin-specific components
├── lib/                   # Utility libraries
│   ├── models/           # MongoDB models
│   ├── services/         # Business logic services
│   ├── validations/      # Zod validation schemas
│   ├── auth/             # Authentication utilities
│   └── mongodb.ts        # Database connection
└── public/               # Static assets
```

## 🗄️ Database Models

### User
- Authentication and authorization
- Role-based access (super_admin, admin, staff)
- Profile management

### Inquiry
- Customer inquiries tracking
- Status management (unread, read, in_progress, resolved, closed)
- Priority levels and categorization

### Client
- Client information management
- Contact details and company information
- Project history and revenue tracking

### Project
- Project management with milestones
- Time tracking and resource allocation
- Budget and deadline management

### ActivityLog
- Complete audit trail
- User action tracking
- Security monitoring

### Settings
- System configuration
- Email settings
- Company information

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcrypt with salt rounds
- **Role-Based Access Control** (RBAC)
- **Input Validation** with Zod schemas
- **Rate Limiting** on API endpoints
- **CORS Protection**
- **SQL Injection Prevention** with parameterized queries

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Inquiries
- `GET /api/inquiries` - List inquiries
- `POST /api/inquiries` - Create inquiry
- `PUT /api/inquiries/[id]` - Update inquiry
- `DELETE /api/inquiries/[id]` - Delete inquiry

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/inquiries` - Inquiry analytics
- `GET /api/analytics/revenue` - Revenue analytics

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB database (local or cloud)
2. Configure environment variables
3. Update default admin credentials

### Build for Production
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance Optimizations

- **Database Indexing** on frequently queried fields
- **API Response Caching** for analytics data
- **Image Optimization** with Next.js Image component
- **Code Splitting** for better loading performance
- **Lazy Loading** for components and routes

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@itconsultancy.com
- 📖 Documentation: [docs.itconsultancy.com](https://docs.itconsultancy.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-repo/issues)

## 🔄 Updates

### Version 1.0.0
- Initial release with core features
- Authentication and authorization
- Dashboard with analytics
- Basic CRUD operations for all entities
- Responsive design implementation

### Upcoming Features
- [ ] Email notifications system
- [ ] File upload and document management
- [ ] Advanced reporting and export
- [ ] API rate limiting and monitoring
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Real-time notifications with WebSockets

---

Built with ❤️ using Next.js, TypeScript, and MongoDB