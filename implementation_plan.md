# Cocoon Lab implementation plan

## 1. Current architecture

- React/TanStack Start frontend with the primary experience in `src/routes/index.tsx`.
- FastAPI provides a staged, session-backed API: `POST /api/segment` runs YOLOv11 instance segmentation; `POST /api/classify/{analysis_id}` classifies only the saved YOLO crops with ResNet18.
- The backend returns real detections, masks/overlays, confidence, quality distribution, grade, and demo value. The legacy combined endpoint remains available.

## 2. Current UI structure

- A warm editorial home page with a cocoon orbit hero, scroll choreography, model explanation, and an in-page analysis instrument.
- The analysis flow already respects the explicit two-stage operation: upload → count → operator starts quality → report.

## 3. Components to preserve

- The cocoon orbit and silk-thread visual language in the hero and workflow.
- `ScrollStory`, `ProcessingFrame`, `StageRail`, and `QualityReport` in the active route.
- The API client and all backend routing, segmentation, classification, grading, and pricing behavior.

## 4. Components to modify

- Refine navigation into clear Explore, Analyze, and Methodology modes.
- Expand the analysis rail into an honest five-step pipeline state display.
- Add a specimen inspection surface using actual detection data—without inventing crop or confidence data.
- Tighten empty, zero-detection, error, and partial-classification communication.

## 5. New components required

- `PipelineStatus`: presents only real waiting, processing, and complete states.
- `SpecimenInspector`: lets an operator select a returned YOLO detection and see its true instance/classification details.

## 6. Animation strategy

- Preserve the existing Motion scroll choreography and orbit.
- Use opacity and transforms for stage transitions, scan beam, and report reveals.
- Honor `prefers-reduced-motion`; avoid simulated percentages or model progress.

## 7. Responsive strategy

- Keep the central orbit and concise navigation on small screens.
- Convert long pipeline and inspection content to a single column below 760px.
- Keep interactive targets and labels readable without horizontal overflow.

## 8. API integration considerations

- YOLO remains the sole count authority.
- Quality classification remains opt-in and receives the original segmentation session ID.
- Detection confidence is shown only where returned. No individual crop image is fabricated because the current API does not return crop assets.

## 9. Risks

- Classification sessions are in memory and can expire; the UI must direct the operator to re-run segmentation.
- A tray can return zero detections or partial/unclassified classifications; these must retain the original YOLO count.
- The existing stylesheet contains legacy, inactive UI rules; changes should stay scoped to the active Cocoon Lab interface.
