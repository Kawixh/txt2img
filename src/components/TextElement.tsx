"use client";

import { useApp } from "@/contexts/AppContext";
import { TextElement as TextElementType } from "@/types";
import { Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
}

export function TextElement({ element, isSelected }: TextElementProps) {
  const { updateTextElement, removeTextElement, selectElement } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    });
    selectElement(element.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    updateTextElement(element.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleContentChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    updateTextElement(element.id, {
      content: e.currentTarget.textContent || "",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeTextElement(element.id);
  };

  const getFontStyle = () => ({
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
    textAlign: element.textAlign as any,
    position: "absolute" as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none" as const,
    outline: "none",
    border: isSelected ? "2px dashed #3b82f6" : "2px dashed transparent",
    padding: "4px",
    borderRadius: "4px",
    minWidth: "20px",
    minHeight: "20px",
  });

  return (
    <div className="relative">
      <div
        ref={elementRef}
        style={getFontStyle()}
        onMouseDown={handleMouseDown}
        onClick={() => selectElement(element.id)}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onBlur={handleContentChange}
      >
        {element.content}
      </div>
      {isSelected && (
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 transform max-w-min translate-x-2 -translate-y-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          style={{
            left: `${element.x + 100}px`,
            top: `${element.y - 10}px`,
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
