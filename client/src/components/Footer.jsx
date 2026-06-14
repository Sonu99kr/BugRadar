export default function Footer() {
  return (
    <div className="bg-[#0a0a0a] px-6 pb-6 pt-2">
      <div className="max-w-6xl mx-auto bg-[#111] border border-[#1f1f1f] rounded-[20px] px-10 py-10">
        {/* Top section */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-0 justify-between">
          {/* Left — branding */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                    strokeDasharray="3 3"
                  />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm tracking-tight">
                BugRadar
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Real-time error monitoring for your web apps. Know when your app
              breaks before your users do.
            </p>

            {/* GitHub only — most relevant for a dev tool portfolio project */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right — only two relevant columns */}
          <div className="flex gap-16">
            {/* Product — only real pages */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Product</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href="/signup"
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    Get Started
                  </a>
                </li>
                <li>
                  <a
                    href="/login"
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    Sign In
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    SDK Docs
                  </a>
                </li>
              </ul>
            </div>

            {/* Support — genuinely useful */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Support</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href="https://github.com/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    Report a Bug
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@bugradar.dev"
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1f1f1f] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © 2026 BugRadar. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-gray-600 text-xs hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-600 text-xs hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
