import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline'

const PaletteHistory = ({ history, currentIndex, onUndo, onRedo }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onUndo}
        disabled={currentIndex <= 0}
        className={`p-2 rounded-lg transition-colors ${
          currentIndex <= 0
            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
        }`}
        title="Undo"
      >
        <ArrowUturnLeftIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onRedo}
        disabled={currentIndex >= history.length - 1}
        className={`p-2 rounded-lg transition-colors ${
          currentIndex >= history.length - 1
            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
        }`}
        title="Redo"
      >
        <ArrowUturnRightIcon className="h-5 w-5" />
      </button>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2">
          {history.map((palette, index) => (
            <div
              key={index}
              className={`flex-none w-32 h-8 rounded-lg overflow-hidden ${
                index === currentIndex ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex h-full">
                {palette.map((color, colorIndex) => (
                  <div
                    key={colorIndex}
                    className="flex-1 h-full"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PaletteHistory 