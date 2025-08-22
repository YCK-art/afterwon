import { X } from 'lucide-react'

const OptionSelector = ({ selectedOptions, onSelect, onClose }) => {
  const options = {
    style: [
      'Liquid Glass',
      'Neon Glow', 
      'Pixel Art',
      'Skeuomorphism',
      '3D',
      'Flat Design',
      'Gradient',
      'Minimalist'
    ],
    type: [
      'Icon',
      'Emoji', 
      'Illustration',
      'Logo',
      'Character'
    ],
    size: [
      '128px',
      '256px',
      '512px',
      '1024px'
    ],
    extra: [
      'Transparent Background',
      'High Resolution',
      'Vector Format'
    ]
  }

  const handleSelect = (category, value) => {
    if (category === 'extra') {
      // Toggle boolean values for extra options
      onSelect(value, !selectedOptions[value])
    } else {
      onSelect(category, value)
    }
  }

  const isSelected = (category, value) => {
    if (category === 'extra') {
      return selectedOptions[value] || false
    }
    return selectedOptions[category] === value
  }

  return (
    <div className="bg-muted border border-border rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Select Options</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Style Options */}
        <div>
          <h4 className="font-medium mb-3 text-foreground/80">Style</h4>
          <div className="space-y-2">
            {options.style.map((style) => (
              <button
                key={style}
                onClick={() => handleSelect('style', style)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected('style', style)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Type Options */}
        <div>
          <h4 className="font-medium mb-3 text-foreground/80">Type</h4>
          <div className="space-y-2">
            {options.type.map((type) => (
              <button
                key={type}
                onClick={() => handleSelect('type', type)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected('type', type)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Size Options */}
        <div>
          <h4 className="font-medium mb-3 text-foreground/80">Size</h4>
          <div className="space-y-2">
            {options.size.map((size) => (
              <button
                key={size}
                onClick={() => handleSelect('size', size)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected('size', size)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Extra Options */}
        <div>
          <h4 className="font-medium mb-3 text-foreground/80">Extra Options</h4>
          <div className="space-y-2">
            {options.extra.map((extra) => (
              <button
                key={extra}
                onClick={() => handleSelect('extra', extra)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected('extra', extra)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50'
                }`}
              >
                {extra}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptionSelector 