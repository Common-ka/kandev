import { expect, type Page } from "@playwright/test";

type Layer = {
  layerId: string;
  backendNodeId?: number;
  drawsContent: boolean;
  width: number;
  height: number;
};

/** Attribution only: enabling the layer domain and reading styles can change timing. */
export async function inspectDenseCompositing(page: Page, selector: string) {
  const cdp = await page.context().newCDPSession(page);
  let layers: Layer[] = [];
  cdp.on("LayerTree.layerTreeDidChange", (event) => {
    layers = event.layers ?? [];
  });
  try {
    await cdp.send("DOM.enable");
    await cdp.send("LayerTree.enable");
    // Request a compositor frame even when the existing layer tree is stable.
    await page.screenshot();
    await expect.poll(() => layers.length).toBeGreaterThan(0);
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    const styles = await page.locator(selector).evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          className: element.getAttribute("class"),
          testId: element.getAttribute("data-testid"),
          width: style.width,
          height: style.height,
          zoom: style.zoom,
          willChange: style.willChange,
          animations: element.getAnimations().map((animation) => ({
            state: animation.playState,
            properties:
              animation.effect instanceof KeyframeEffect
                ? [...new Set(animation.effect.getKeyframes().flatMap(Object.keys))]
                : [],
          })),
        };
      }),
    );
    const targets = [];
    for (const [index, nodeId] of nodeIds.entries()) {
      const { node } = await cdp.send("DOM.describeNode", { nodeId });
      const owned = [];
      for (const layer of layers.filter((item) => item.backendNodeId === node.backendNodeId)) {
        const reasons = await cdp.send("LayerTree.compositingReasons", { layerId: layer.layerId });
        owned.push({
          ...layer,
          reasons: reasons.compositingReasons,
          reasonIds: reasons.compositingReasonIds,
        });
      }
      targets.push({
        tag: node.nodeName,
        backendNodeId: node.backendNodeId,
        ...styles[index],
        layers: owned,
      });
    }
    return { layerCount: layers.length, targets };
  } finally {
    await cdp.detach();
  }
}
