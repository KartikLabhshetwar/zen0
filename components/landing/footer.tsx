export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-light text-black">zen0</h3>
          <p className="text-gray-600 mt-2">AI conversations with blazing fast responses</p>
        </div>
        <div className="text-gray-500 text-sm text-center">
          © {new Date().getFullYear()} zen0. Built for speed.
        </div>
      </div>
    </footer>
  )
}
