import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Plus,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { generateImageFromPrompt } from './services/generationApi.js'
import './App.css'

const attributes = [
  'Brown hair',
  'Black hair',
  'Blond hair',
  'Gray hair',
  'Smiling',
  'Eyeglasses',
  'Wearing a hat',
  'Heavy makeup',
]

const examplePrompts = [
  { prompt: 'A woman smiling with blonde hair', tint: 'lavender' },
  { prompt: 'Brown hair, eyeglasses, soft light', tint: 'blue' },
  { prompt: 'Black hair and a confident smile', tint: 'coral' },
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')

  useEffect(() => {
    if (!generatedImageUrl) return undefined

    return () => URL.revokeObjectURL(generatedImageUrl)
  }, [generatedImageUrl])

  async function handleGenerate(event) {
    event.preventDefault()

    if (!prompt.trim()) {
      setErrorMessage('Add a description to begin.')
      return
    }

    setErrorMessage('')
    setGeneratedImageUrl('')
    setIsGenerating(true)

    try {
      const imageBlob = await generateImageFromPrompt(prompt.trim())
      setGeneratedImageUrl(URL.createObjectURL(imageBlob))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Image generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function selectExample(examplePrompt) {
    setPrompt(examplePrompt)
    setErrorMessage('')
    setGeneratedImageUrl('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#studio" aria-label="FaceForge AI studio">
          <span className="brand-mark"><WandSparkles size={18} strokeWidth={2.2} /></span>
          <span className="brand-name">faceforge<span>AI</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item nav-item-active" href="#studio" aria-current="page">
            <Sparkles size={17} />
            <span>Studio</span>
            <span className="nav-shortcut">CTRL 1</span>
          </a>
          <a className="nav-item" href="#history">
            <Layers3 size={17} />
            <span>History</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="service-card">
            <div className="service-card-top">
              <span className="service-dot" />
              <span>MODEL SERVICE</span>
            </div>
            <div className="service-title">Awaiting connection</div>
            <div className="service-subtitle">Attribute-conditioned DDPM</div>
          </div>
          <button className="help-link" type="button">
            <CircleHelp size={16} />
            <span>Help &amp; support</span>
            <ChevronRight className="help-chevron" size={15} />
          </button>
          <div className="account-row">
            <div className="avatar">FF</div>
            <div className="account-copy"><strong>FaceForge</strong><span>Personal workspace</span></div>
            <button className="icon-button account-menu" type="button" aria-label="Workspace options">
              <span>...</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column" id="studio">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Studio</strong></div>
          <div className="topbar-right">
            <span className="plan-label"><span className="plan-dot" /> LOCAL MODEL</span>
            <button className="icon-button topbar-help" type="button" aria-label="Help">
              <CircleHelp size={17} />
            </button>
          </div>
        </header>

        <main className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> PORTRAIT STUDIO</div>
              <h1>Make a face feel <span>real.</span></h1>
              <p>Shape a portrait with a few words.</p>
            </div>
            <div className="step-indicator"><span>01</span><i />02</div>
          </section>

          <section className="studio-grid" aria-label="Portrait generator">
            <form className="prompt-panel" onSubmit={handleGenerate}>
              <div className="panel-heading">
                <div className="panel-icon"><Sparkles size={17} /></div>
                <div><h2>Your prompt</h2><p>Describe the portrait you have in mind</p></div>
              </div>

              <label className="sr-only" htmlFor="portrait-prompt">Portrait description</label>
              <textarea
                id="portrait-prompt"
                value={prompt}
                disabled={isGenerating}
                onChange={(event) => {
                  setPrompt(event.target.value)
                  setErrorMessage('')
                  setGeneratedImageUrl('')
                }}
                placeholder="A woman smiling with blonde hair..."
                maxLength={500}
              />
              <div className="prompt-meta"><span>Describe visible attributes</span><span>{prompt.length} / 500</span></div>

              <div className="attribute-section">
                <div className="section-label"><span>SUPPORTED ATTRIBUTES</span><span>08</span></div>
                <div className="attribute-list">
                  {attributes.map((attribute) => <span className="attribute-chip" key={attribute}>{attribute}</span>)}
                </div>
              </div>

              <div className="prompt-footer">
                <div className="privacy-note"><span className="privacy-mark"><Check size={11} /></span><span>Designed for local inference</span></div>
                <button className="generate-button" type="submit" disabled={isGenerating}>
                  {isGenerating ? <LoaderCircle className="loading-icon" size={16} /> : <Sparkles size={16} />}
                  <span>{isGenerating ? 'Generating...' : 'Generate face'}</span>
                  {!isGenerating && <ChevronRight className="button-arrow" size={14} />}
                </button>
              </div>
              <div className={`generation-notice${errorMessage ? ' is-visible is-error' : ''}`} role="alert" aria-live="polite">{errorMessage}</div>
            </form>

            <section className="preview-panel" aria-label="Generated portrait preview">
              <div className="preview-toolbar">
                <div className="preview-title"><span className="preview-live-dot" /> <span>PREVIEW</span></div>
                {generatedImageUrl ? (
                  <a className="download-button is-ready" href={generatedImageUrl} download="faceforge-generated.png">
                    <ArrowDownToLine size={15} /><span>Download</span>
                  </a>
                ) : (
                  <button className="download-button" type="button" disabled title="Available after a portrait is generated">
                    <ArrowDownToLine size={15} /><span>Download</span>
                  </button>
                )}
              </div>
              <div className={`preview-canvas${isGenerating ? ' is-generating' : ''}`} aria-busy={isGenerating}>
                <div className="canvas-grid" />
                <div className="canvas-corner corner-tl" /><div className="canvas-corner corner-tr" />
                <div className="canvas-corner corner-bl" /><div className="canvas-corner corner-br" />
                {isGenerating ? (
                  <div className="loading-preview" role="status">
                    <LoaderCircle className="loading-icon" size={25} />
                    <h3>Creating your portrait</h3>
                    <p>The local model is generating an image</p>
                  </div>
                ) : generatedImageUrl ? (
                  <img className="generated-image" src={generatedImageUrl} alt={`Generated portrait: ${prompt}`} />
                ) : (
                  <div className="empty-preview">
                    <div className="preview-symbol"><ImagePlus size={23} strokeWidth={1.6} /><span /></div>
                    <h3>Your canvas is clear</h3>
                    <p>A generated portrait will appear here</p>
                  </div>
                )}
                <div className="canvas-format"><span>OUTPUT</span><strong>64 x 64</strong><i />RGB</div>
              </div>
              <div className="preview-caption">
                <span>PORTRAIT OUTPUT</span>
                <span className={generatedImageUrl ? 'caption-ready' : ''}>
                  <span className={`caption-dot${generatedImageUrl ? ' is-ready' : ''}`} />
                  {isGenerating ? 'GENERATING' : generatedImageUrl ? 'IMAGE READY' : 'WAITING FOR MODEL'}
                </span>
              </div>
            </section>
          </section>

          <section className="history-section" id="history">
            <div className="history-heading">
              <div className="history-title-wrap"><div className="history-heading-icon"><Clock3 size={16} /></div><div><h2>Prompt ideas</h2><p>Start with a description</p></div></div>
              <button className="text-button" type="button" disabled={isGenerating} onClick={() => { setPrompt(''); setErrorMessage(''); setGeneratedImageUrl('') }}><Plus size={15} /> New prompt</button>
            </div>
            <div className="history-list">
              {examplePrompts.map((item, index) => (
                <button className="history-item" type="button" key={item.prompt} disabled={isGenerating} onClick={() => selectExample(item.prompt)}>
                  <span className={`history-swatch ${item.tint}`}><span>0{index + 1}</span></span>
                  <span className="history-copy"><strong>{item.prompt}</strong><span>EXAMPLE PROMPT</span></span>
                  <span className="history-select"><ChevronRight size={16} /></span>
                </button>
              ))}
            </div>
          </section>
          <footer className="page-footer"><span>FACEFORGE AI</span><span>Private by design <i /> Attribute-conditioned generation</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
