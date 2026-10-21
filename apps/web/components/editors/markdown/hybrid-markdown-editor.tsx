"use client";

import { useEffect, useRef, useState } from "react";
import {
  CommentModeController,
  CommentsModel,
  CommentsView,
  EditorController,
  EditorModel,
  EditorView,
  LocalHistoryStrategy,
  OffsetRange,
  Selection,
  StringEdit,
  StringValue,
  type Comment,
  type CommentSubmission,
  type EditorViewOptions,
  type MonacoSyntaxHighlighter,
} from "@vscode/markdown-editor";
import "@vscode/markdown-editor/editor.css";
import { insertMarkdownTableColumn, insertMarkdownTableRow } from "./markdown-table-edit";
import { HybridMarkdownTableEdgeChrome } from "./hybrid-markdown-table-edge";
import { findActiveTableRange, useActiveTableControlsHost } from "./hybrid-markdown-table-controls";
import "./hybrid-markdown-editor.css";
import { createMarkdownSyntaxHighlighter } from "./hybrid-markdown-syntax-highlighter";
import { HybridMarkdownComments } from "./hybrid-markdown-comments";
import type { SourcePositionProps } from "../source-position";
import {
  useHybridSourcePosition,
  cancelHybridSourcePositionReveal,
} from "./use-hybrid-source-position";

export function isHybridMarkdownSupported(): boolean {
  const capability = (globalThis as { EditContext?: unknown }).EditContext;
  if (typeof capability !== "function") return false;
  try {
    Reflect.construct(Object, [], capability);
    return true;
  } catch {
    return false;
  }
}

export type MarkdownSourceRange = {
  start: number;
  endExclusive: number;
};

export type MarkdownGutterMarker = MarkdownSourceRange & {
  kind: "added" | "modified" | "deleted";
};

export type MarkdownComment = MarkdownSourceRange & {
  id: string;
  body: string;
  author?: string;
  createdAt?: number;
};

export type HybridMarkdownEditorProps = SourcePositionProps & {
  content: string;
  readOnly?: boolean;
  baseline?: string;
  gutterMarkers?: readonly MarkdownGutterMarker[];
  comments?: readonly MarkdownComment[];
  className?: string;
  onChange: (content: string) => void;
  onOpenLink?: (url: string) => boolean | void;
  onComment?: (comment: MarkdownCommentSubmission) => void;
  onError?: (error: unknown) => void;
  onSourceFallback?: () => void;
};

export type MarkdownCommentSubmission = {
  text: string;
  start: number;
  endExclusive: number;
};

type EditorLifecycle = {
  active: boolean;
  selectionSubscription?: { dispose: () => void };
  sourcePositionReveal?: { dispose: () => void };
  model: EditorModel;
  view: EditorView;
  controller: EditorController;
  commentsModel: CommentsModel;
  commentsView: CommentsView;
  commentMode: CommentModeController;
  historyStrategy: LocalHistoryStrategy;
  syntaxHighlighter: MonacoSyntaxHighlighter;
  sourceEditSubscription: { dispose: () => void };
};

type EditorCallbackRefs = {
  onChange: { current: (content: string) => void };
  onOpenLink: { current: ((url: string) => boolean | void) | undefined };
  onComment: { current: ((comment: MarkdownCommentSubmission) => void) | undefined };
  onError: { current: ((error: unknown) => void) | undefined };
  onSourceFallback: { current: (() => void) | undefined };
};

type MutableRef<T> = { current: T };

export function HybridMarkdownEditor({
  content,
  readOnly = false,
  baseline,
  gutterMarkers = [],
  comments = [],
  className,
  onChange,
  onOpenLink,
  onComment,
  onError,
  onSourceFallback,
  onSourcePositionHandle,
  isActive = true,
}: HybridMarkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lifecycleRef = useRef<EditorLifecycle | null>(null);
  const canonicalContentRef = useRef(content);
  const callbackRefs = useRef<EditorCallbackRefs>({
    onChange: { current: onChange },
    onOpenLink: { current: onOpenLink },
    onComment: { current: onComment },
    onError: { current: onError },
    onSourceFallback: { current: onSourceFallback },
  }).current;

  callbackRefs.onChange.current = onChange;
  callbackRefs.onOpenLink.current = onOpenLink;
  callbackRefs.onComment.current = onComment;
  callbackRefs.onError.current = onError;
  callbackRefs.onSourceFallback.current = onSourceFallback;

  const editorLifecycle = useHybridEditorLifecycle({
    rootRef,
    lifecycleRef,
    canonicalContentRef,
    callbackRefs,
    content,
    readOnly,
    baseline,
    gutterMarkers,
    comments,
  });
  useHybridEditorContentSync({ lifecycleRef, canonicalContentRef, callbackRefs, content });
  useHybridEditorOptionsSync({
    lifecycleRef,
    callbackRefs,
    readOnly,
    baseline,
    gutterMarkers,
    comments,
  });
  useHybridSourcePosition({
    lifecycle: editorLifecycle,
    rootRef,
    content,
    isActive,
    onSourcePositionHandle,
    onError: (error) => reportEditorFailure(lifecycleRef, callbackRefs, error),
  });
  const tableControlsHost = useActiveTableControlsHost(rootRef, !readOnly, lifecycleRef);

  return (
    <>
      <div
        ref={rootRef}
        className={
          className
            ? `kandev-hybrid-markdown-editor-root ${className}`
            : "kandev-hybrid-markdown-editor-root"
        }
        data-testid="hybrid-markdown-editor"
      />
      <HybridMarkdownComments
        lifecycle={editorLifecycle}
        enabled={isActive && !readOnly && !!onComment}
        onComment={onComment}
      />
      <HybridMarkdownTableEdgeChrome
        host={tableControlsHost?.host ?? null}
        tableKey={tableControlsHost?.tableKey ?? null}
        onInsertRow={(rowIndex) => applyActiveTableEdit(lifecycleRef, "row", rowIndex)}
        onInsertColumn={(columnIndex) => applyActiveTableEdit(lifecycleRef, "column", columnIndex)}
      />
    </>
  );
}

type LifecycleHookOptions = {
  rootRef: MutableRef<HTMLDivElement | null>;
  lifecycleRef: MutableRef<EditorLifecycle | null>;
  canonicalContentRef: MutableRef<string>;
  callbackRefs: EditorCallbackRefs;
  content: string;
  readOnly: boolean;
  baseline: string | undefined;
  gutterMarkers: readonly MarkdownGutterMarker[];
  comments: readonly MarkdownComment[];
};

function useHybridEditorLifecycle({
  rootRef,
  lifecycleRef,
  canonicalContentRef,
  callbackRefs,
  content,
  readOnly,
  baseline,
  gutterMarkers,
  comments,
}: LifecycleHookOptions): EditorLifecycle | null {
  const [currentLifecycle, setCurrentLifecycle] = useState<EditorLifecycle | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let disposed = false;
    let lifecycle: EditorLifecycle | null = null;
    const fail = (error: unknown) => {
      if (disposed) return;
      disposed = true;
      disposeEditorLifecycle(lifecycle);
      lifecycle = null;
      lifecycleRef.current = null;
      setCurrentLifecycle(null);
      root.replaceChildren();
      reportEditorDiagnostic("initialize");
      callbackRefs.onError.current?.(error);
      callbackRefs.onSourceFallback.current?.();
    };

    if (!isHybridMarkdownSupported()) {
      callbackRefs.onSourceFallback.current?.();
      return;
    }

    try {
      lifecycle = createEditorLifecycle({
        root,
        content,
        readOnly,
        baseline,
        gutterMarkers,
        comments,
        onOpenLink: (url) => {
          const handler = callbackRefs.onOpenLink.current;
          if (!handler) return false;
          return handler(url) === false ? false : undefined;
        },
        onComment: (submission) => {
          if (!disposed && lifecycle?.active) callbackRefs.onComment.current?.(submission);
        },
        onSourceEdit: (nextContent) => {
          if (disposed || !lifecycle?.active) return;
          try {
            canonicalContentRef.current = nextContent;
            callbackRefs.onChange.current(nextContent);
          } catch (error) {
            fail(error);
          }
        },
      });
      lifecycleRef.current = lifecycle;
      setCurrentLifecycle(lifecycle);
    } catch (error) {
      fail(error);
    }

    return () => {
      disposed = true;
      disposeEditorLifecycle(lifecycle);
      lifecycle = null;
      lifecycleRef.current = null;
    };
    // The editor is intentionally initialized once per mounted file surface.
    // Callback and document updates are synchronized by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return currentLifecycle;
}

type ContentSyncOptions = Pick<
  LifecycleHookOptions,
  "lifecycleRef" | "canonicalContentRef" | "callbackRefs" | "content"
>;

function useHybridEditorContentSync({
  lifecycleRef,
  canonicalContentRef,
  callbackRefs,
  content,
}: ContentSyncOptions): void {
  useEffect(() => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle || canonicalContentRef.current === content) return;

    try {
      const selection = lifecycle.model.selection.get();
      cancelHybridSourcePositionReveal(lifecycle);
      lifecycle.model.replaceSourceText(new StringValue(content));
      if (selection)
        setObservable(
          lifecycle.model.selection,
          new Selection(
            Math.max(0, Math.min(content.length, selection.anchor)),
            Math.max(0, Math.min(content.length, selection.active)),
          ),
        );
      canonicalContentRef.current = content;
    } catch (error) {
      reportEditorFailure(lifecycleRef, callbackRefs, error);
    }
  }, [callbackRefs, canonicalContentRef, content, lifecycleRef]);
}

type OptionsSyncOptions = Pick<
  LifecycleHookOptions,
  "lifecycleRef" | "callbackRefs" | "readOnly" | "baseline" | "gutterMarkers" | "comments"
>;

function useHybridEditorOptionsSync({
  lifecycleRef,
  callbackRefs,
  readOnly,
  baseline,
  gutterMarkers,
  comments,
}: OptionsSyncOptions): void {
  useEffect(() => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle) return;

    try {
      setObservable(lifecycle.model.readonlyMode, readOnly);
      setObservable(
        lifecycle.model.baseline,
        baseline === undefined ? undefined : new StringValue(baseline),
      );
      setObservable(lifecycle.model.gutterMarkers, toGutterMarkers(gutterMarkers));
      lifecycle.commentsModel.set(toComments(comments));
    } catch (error) {
      reportEditorFailure(lifecycleRef, callbackRefs, error);
    }
  }, [baseline, callbackRefs, comments, gutterMarkers, lifecycleRef, readOnly]);
}

type CreateEditorLifecycleOptions = {
  root: HTMLDivElement;
  content: string;
  readOnly: boolean;
  baseline: string | undefined;
  gutterMarkers: readonly MarkdownGutterMarker[];
  comments: readonly MarkdownComment[];
  onOpenLink: NonNullable<EditorViewOptions["onOpenLink"]>;
  onComment: (submission: MarkdownCommentSubmission) => void;
  onSourceEdit: (content: string) => void;
};

function createEditorLifecycle({
  root,
  content,
  readOnly,
  baseline,
  gutterMarkers,
  comments,
  onOpenLink,
  onComment,
  onSourceEdit,
}: CreateEditorLifecycleOptions): EditorLifecycle {
  let model: EditorModel | undefined;
  let view: EditorView | undefined;
  let controller: EditorController | undefined;
  let commentsModel: CommentsModel | undefined;
  let commentsView: CommentsView | undefined;
  let commentMode: CommentModeController | undefined;
  let historyStrategy: LocalHistoryStrategy | undefined;
  let syntaxHighlighter: MonacoSyntaxHighlighter | undefined;
  let sourceEditSubscription: { dispose: () => void } | undefined;

  try {
    model = new EditorModel();
    setObservable(model.sourceText, new StringValue(content));
    setObservable(model.readonlyMode, readOnly);
    setObservable(model.baseline, baseline === undefined ? undefined : new StringValue(baseline));
    setObservable(model.gutterMarkers, toGutterMarkers(gutterMarkers));
    syntaxHighlighter = createMarkdownSyntaxHighlighter();

    const viewOptions: EditorViewOptions = {
      classNames: ["kandev-hybrid-markdown-editor"],
      showReadonlyToggle: false,
      onOpenLink,
      syntaxHighlighter,
    };
    view = new EditorView(model, viewOptions);
    root.replaceChildren(view.element);
    historyStrategy = new LocalHistoryStrategy(model);
    controller = new EditorController(model, view, {
      historyStrategy,
    });
    commentsModel = new CommentsModel();
    commentsModel.set(toComments(comments));
    commentsView = new CommentsView(commentsModel, view);
    commentMode = new CommentModeController(model, view, {
      onSubmit: (submission) => onComment(toCommentSubmission(submission)),
    });
    sourceEditSubscription = subscribeToAppliedSourceEdits(model, onSourceEdit);

    return {
      active: true,
      model,
      view,
      controller,
      commentsModel,
      commentsView,
      commentMode,
      historyStrategy,
      syntaxHighlighter,
      sourceEditSubscription,
    };
  } catch (error) {
    disposeEditorParts({
      model,
      view,
      controller,
      commentsModel,
      commentsView,
      commentMode,
      historyStrategy,
      syntaxHighlighter,
      sourceEditSubscription,
    });
    throw error;
  }
}

function reportEditorFailure(
  lifecycleRef: MutableRef<EditorLifecycle | null>,
  callbackRefs: EditorCallbackRefs,
  error: unknown,
): void {
  const lifecycle = lifecycleRef.current;
  if (!lifecycle?.active) return;
  lifecycle.view.element.remove();
  disposeEditorLifecycle(lifecycle);
  lifecycleRef.current = null;
  reportEditorDiagnostic("update");
  callbackRefs.onError.current?.(error);
  callbackRefs.onSourceFallback.current?.();
}

function subscribeToAppliedSourceEdits(
  model: EditorModel,
  onSourceEdit: (content: string) => void,
): { dispose: () => void } {
  let active = true;
  let notificationScheduled = false;
  const subscription = model.onWillApplySourceEdit(() => {
    if (notificationScheduled) return;
    notificationScheduled = true;
    queueMicrotask(() => {
      notificationScheduled = false;
      if (!active) return;
      onSourceEdit(model.sourceText.get().value);
    });
  });

  return {
    dispose: () => {
      active = false;
      subscription.dispose();
    },
  };
}

function setObservable<T>(
  observable: { set: (value: T, transaction: undefined, change: undefined) => void },
  value: T,
): void {
  observable.set(value, undefined, undefined);
}

function toGutterMarkers(markers: readonly MarkdownGutterMarker[]) {
  return markers.map(({ start, endExclusive, kind }) => ({
    type: kind,
    range: new OffsetRange(start, endExclusive),
  }));
}

function toComments(comments: readonly MarkdownComment[]): Comment[] {
  return comments.map(({ id, start, endExclusive, body, author, createdAt }) => ({
    id,
    range: new OffsetRange(start, endExclusive),
    body,
    author,
    createdAt,
  }));
}

function toCommentSubmission(submission: CommentSubmission): MarkdownCommentSubmission {
  return {
    text: submission.text,
    start: submission.range.start,
    endExclusive: submission.range.endExclusive,
  };
}

function disposeEditorLifecycle(lifecycle: EditorLifecycle | null): void {
  if (!lifecycle?.active) return;
  lifecycle.active = false;
  disposeEditorParts(lifecycle);
}

function disposeEditorParts(parts: Partial<EditorLifecycle>): void {
  parts.sourcePositionReveal?.dispose();
  parts.sourcePositionReveal = undefined;
  parts.selectionSubscription?.dispose();
  parts.sourceEditSubscription?.dispose();
  parts.commentMode?.dispose();
  parts.commentsView?.dispose();
  parts.controller?.dispose();
  parts.view?.dispose();
  parts.syntaxHighlighter?.dispose();
  // The pinned package exposes EditorModel.dispose() at runtime, but its public
  // declaration does not include the lifecycle method.
  (parts.model as unknown as { dispose?: () => void } | undefined)?.dispose?.();
}

function applyActiveTableEdit(
  lifecycleRef: MutableRef<EditorLifecycle | null>,
  operation: "row" | "column",
  index: number,
): void {
  const lifecycle = lifecycleRef.current;
  if (!lifecycle) return;
  const activeBlock = lifecycle.model.activeBlock.get();
  if (!activeBlock || activeBlock.kind !== "table") return;

  const range = findActiveTableRange(lifecycle.model, activeBlock);
  if (!range) return;
  const source = lifecycle.model.sourceText.get().value;
  const tableSource = source.slice(range.start, range.endExclusive);
  const result =
    operation === "row"
      ? insertMarkdownTableRow(tableSource, index)
      : insertMarkdownTableColumn(tableSource, index);
  if (result.source === tableSource) return;

  const edit = StringEdit.replace(new OffsetRange(range.start, range.endExclusive), result.source);
  lifecycle.historyStrategy.record(
    () =>
      lifecycle.model.applyEdit(edit, Selection.collapsed(range.start + result.selectionOffset)),
    edit,
  );
}

function reportEditorDiagnostic(operation: "initialize" | "update"): void {
  // i18n-exempt: Structured diagnostic identifiers contain no user copy or document data.
  console.warn("hybrid_markdown_editor_failure", {
    fileType: "markdown",
    mode: "edit",
    operation,
    upstreamVersion: "0.0.2-84",
  });
}
