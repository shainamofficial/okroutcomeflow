import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface MentionedUser {
  id: string;
  name: string;
  email: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Write a comment...",
  disabled = false,
}: MentionInputProps) {
  const { users } = useOrgUsers();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(suggestionQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(suggestionQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check if we're in a mention context (after @)
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Show suggestions if no space after @
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setSuggestionQuery(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    // Update mentioned users based on current content
    const updatedMentions = mentionedUsers.filter((user) =>
      newValue.includes(`@${user.name}`)
    );
    setMentionedUsers(updatedMentions);

    onChange(newValue, updatedMentions.map((u) => u.id));
  };

  const insertMention = useCallback(
    (user: { id: string; name: string; email: string }) => {
      if (!textareaRef.current) return;

      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      const textAfterCursor = value.slice(cursorPosition);

      const newValue =
        value.slice(0, lastAtIndex) + `@${user.name} ` + textAfterCursor;

      const newMentions = [...mentionedUsers, { id: user.id, name: user.name, email: user.email }];
      setMentionedUsers(newMentions);
      setShowSuggestions(false);
      onChange(newValue, newMentions.map((u) => u.id));

      // Focus and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = lastAtIndex + user.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    },
    [value, mentionedUsers, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === "Enter" && showSuggestions) {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] resize-none"
      />
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                index === selectedIndex && "bg-accent"
              )}
              onClick={() => insertMention(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-medium">{user.name || "Unnamed"}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
