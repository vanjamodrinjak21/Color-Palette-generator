import { useEffect } from 'react'

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-lg">
        {message}
      </div>
    </div>
  )
}

export default Toast 