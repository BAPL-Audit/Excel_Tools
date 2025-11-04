import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Professional Audit Tools
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in">
            A comprehensive dashboard for auditors with professional tools, project management,
            and seamless workflow integration. Streamline your auditing process with powerful,
            easy-to-use tools designed for efficiency and accuracy.
          </p>

          {user ? (
            <div className="space-y-4">
              <Link to="/dashboard" className="btn btn-primary text-lg px-8 py-4">
                Go to Dashboard
              </Link>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold">{user.name}</span>!
              </p>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything You Need for Professional Auditing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
              <p className="text-gray-600">
                Access a comprehensive suite of audit tools designed for security professionals
                and compliance experts.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Project Management</h3>
              <p className="text-gray-600">
                Organize your audit projects, track progress, and maintain detailed records
                of your findings and results.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your audit data is encrypted and secure. Industry-standard security practices
                protect your sensitive information.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
              <p className="text-gray-600">
                Optimized tools that deliver results quickly, allowing you to complete audits
                efficiently without compromising thoroughness.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Responsive Design</h3>
              <p className="text-gray-600">
                Access your audit tools from any device. Our responsive interface works seamlessly
                on desktop, tablet, and mobile.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold mb-2">Admin Control</h3>
              <p className="text-gray-600">
                Administrators can easily add new tools, manage users, and customize the platform
                to meet specific organizational needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Streamline Your Audit Workflow?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who trust our platform for their audit needs.
            Start your free trial today and experience the difference.
          </p>

          {user ? (
            <Link to="/dashboard" className="btn btn-primary text-lg px-8 py-4">
              Access Your Dashboard
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary text-lg px-8 py-4">
              Start Free Trial
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home