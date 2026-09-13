(function () {
  function preparePageSnapshot() {
    if (typeof Container === "undefined" || Container.pageSnapshot) return

    const snapshot = document.createElement("canvas")
    snapshot.width = Math.max(1, window.innerWidth)
    snapshot.height = Math.max(
      1,
      document.documentElement.scrollHeight,
      window.innerHeight
    )

    const context = snapshot.getContext("2d")
    if (!context) return

    context.fillStyle = "#000000"
    context.fillRect(0, 0, snapshot.width, snapshot.height)

    document.querySelectorAll('canvas[data-liquid-glass-source="starfield"]').forEach(function (canvas) {
      const rect = canvas.getBoundingClientRect()
      try {
        context.drawImage(canvas, rect.left, rect.top, rect.width, rect.height)
      } catch (_) {
        // Keep the black snapshot if a browser cannot copy a source canvas.
      }
    })

    Container.pageSnapshot = snapshot
    Container.isCapturing = false
  }

  function mount(root, options) {
    if (!root || typeof Button === "undefined") return null

    preparePageSnapshot()

    window.glassControls = {
      edgeIntensity: 0.012,
      rimIntensity: 0.045,
      baseIntensity: 0.008,
      edgeDistance: 0.16,
      rimDistance: 0.82,
      baseDistance: 0.1,
      cornerBoost: 0.02,
      rippleEffect: 0.08,
      blurRadius: 0.1
    }

    const button = new Button({
      text: options.text,
      size: options.size || 18,
      type: "pill",
      tintOpacity: 0.24,
      warp: true
    })

    button.element.classList.add("hackky-liquid-glass")
    button.element.setAttribute("aria-hidden", "true")
    button.element.style.pointerEvents = "none"
    root.replaceChildren(button.element)

    requestAnimationFrame(function () {
      button.updateSizeFromDOM()
    })

    return {
      destroy: function () {
        if (button.gl_refs) button.gl_refs.gl = null
        if (button.element) button.element.remove()
        if (typeof Container !== "undefined" && Array.isArray(Container.instances)) {
          Container.instances = Container.instances.filter(function (instance) {
            return instance !== button
          })
        }
      }
    }
  }

  function mountPanel(root) {
    if (!root || typeof Container === "undefined") return null

    preparePageSnapshot()

    const panel = new Container({
      borderRadius: 18,
      type: "pill",
      tintOpacity: 0.015
    })

    panel.element.classList.add("hackky-liquid-panel")
    panel.element.setAttribute("aria-hidden", "true")
    panel.element.style.pointerEvents = "none"
    root.replaceChildren(panel.element)

    requestAnimationFrame(function () {
      panel.updateSizeFromDOM()
    })

    return {
      destroy: function () {
        if (panel.gl_refs) panel.gl_refs.gl = null
        if (panel.element) panel.element.remove()
        if (Array.isArray(Container.instances)) {
          Container.instances = Container.instances.filter(function (instance) {
            return instance !== panel
          })
        }
      }
    }
  }

  window.LiquidGlassBridge = { mount: mount, mountPanel: mountPanel }
})()
