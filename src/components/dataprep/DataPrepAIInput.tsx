import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, Check, X, CornerDownLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { DataPrepPreviewResponse } from '@/types/dataPrep';
import { extractQuickReplies, QuickReplyChips } from './QuickReplyChips';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isClarification?: boolean;
  quickReplies?: string[];
  ruleData?: {
    rule: Record<string, unknown>;
    preview?: DataPrepPreviewResponse;
    ai_explanation?: string;
  };
}

interface AIInterpretResponse {
  status: 'rule_ready' | 'clarification_needed' | 'error';
  rule?: Record<string, unknown>;
  preview?: DataPrepPreviewResponse;
  ai_explanation?: string;
  clarification_message?: string;
}

interface DataPrepAIInputProps {
  projectId: string;
  onRuleCreated: () => void;
  availableVariables?: string[];
  variableLabels?: Record<string, string>;
}

export function DataPrepAIInput({ projectId, onRuleCreated, availableVariables = [], variableLabels = {} }: DataPrepAIInputProps) {
  const { t, language } = useLanguage();
  const dp = t.dataPrep;
  const ai = (dp as Record<string, unknown>).ai as Record<string, string> | undefined;

  const [input, setInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRule, setPendingRule] = useState<Record<string, unknown> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setReplyInput('');
    setIsLoading(true);

    try {
      const conversationHistory = newMessages.map(({ role, content }) => ({ role, content }));
      // Build variable context for the AI: send names with labels
      const variableContext = availableVariables.length > 0
        ? availableVariables.map(v => {
            const label = variableLabels[v];
            return label ? `${v} (${label})` : v;
          })
        : undefined;
      const response = await api.post<AIInterpretResponse>(
        `/projects/${projectId}/data-prep/ai-interpret`,
        {
          message: text,
          language,
          conversation_history: conversationHistory,
          available_variables: variableContext,
        }
      );

      if (response.status === 'rule_ready' && response.rule) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.ai_explanation || (ai?.ruleReady || 'Rule ready to create:'),
          ruleData: {
            rule: response.rule,
            preview: response.preview,
            ai_explanation: response.ai_explanation,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setPendingRule(response.rule);
      } else if (response.status === 'clarification_needed') {
        const clarText = response.clarification_message || '';
        const detectedOptions = extractQuickReplies(clarText);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: clarText,
            isClarification: true,
            quickReplies: detectedOptions.length >= 2 ? detectedOptions : undefined,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${response.clarification_message || 'Error'}` },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : 'Error'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!pendingRule) return;
    setIsLoading(true);
    try {
      await api.post(`/projects/${projectId}/data-prep`, pendingRule);
      toast.success(dp?.ruleCreated || 'Rule created');
      onRuleCreated();
      clearConversation();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (text: string) => {
    handleSubmit(text);
  };

  const clearConversation = () => {
    setMessages([]);
    setPendingRule(null);
    setInput('');
    setReplyInput('');
  };

  const ruleTypeBadgeLabel = (type: string) => {
    const map: Record<string, string> = {
      cleaning: dp?.typeCleaning || 'Cleaning',
      weight: dp?.typeWeight || 'Weight',
      net: dp?.typeNet || 'Net',
      recode: dp?.typeRecode || 'Recode',
      computed: dp?.typeComputed || 'Computed',
    };
    return map[type] || type;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="py-3 px-4 space-y-3">
        {/* Input row */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={ai?.placeholder || "Describe a rule in natural language..."}
            disabled={isLoading}
            className="h-9 text-sm"
          />
          <Button
            size="sm"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="h-9 px-3 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Chat area */}
        {messages.length > 0 && (
          <div className="relative">
            <ScrollArea className="max-h-[200px]">
              <div ref={scrollRef} className="space-y-2 pr-2">
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {/* Quick reply chips for clarification messages */}
                    {msg.isClarification && msg.quickReplies && msg.quickReplies.length > 0 && !pendingRule && (
                      <QuickReplyChips
                        options={msg.quickReplies}
                        onSelect={handleReply}
                        disabled={isLoading}
                      />
                    )}

                    {/* Rule preview card */}
                    {msg.ruleData && (
                      <Card className="mt-2 border-primary/30">
                        <CardContent className="py-3 px-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {(msg.ruleData.rule as Record<string, unknown>).name as string}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ruleTypeBadgeLabel(
                                (msg.ruleData.rule as Record<string, unknown>).rule_type as string
                              )}
                            </Badge>
                          </div>

                          {msg.ruleData.preview && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                {dp?.originalRows || 'Original rows'}:{' '}
                                <strong className="text-foreground">
                                  {msg.ruleData.preview.original_rows}
                                </strong>
                              </span>
                              <span>
                                {dp?.finalRows || 'Final rows'}:{' '}
                                <strong className="text-foreground">
                                  {msg.ruleData.preview.final_rows}
                                </strong>
                              </span>
                              <span>
                                {ai?.rowsAffected || 'Rows affected'}:{' '}
                                <strong className="text-foreground">
                                  {msg.ruleData.preview.rows_affected}
                                </strong>
                              </span>
                              {msg.ruleData.preview.columns_added.length > 0 && (
                                <span className="col-span-2 flex flex-wrap gap-1 items-center">
                                  {ai?.columnsAdded || 'Columns added'}:{' '}
                                  {msg.ruleData.preview.columns_added.map((c) => (
                                    <Badge key={c} variant="secondary" className="text-xs">
                                      {c}
                                    </Badge>
                                  ))}
                                </span>
                              )}
                            </div>
                          )}

                          {pendingRule && (
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" className="h-7 text-xs" onClick={handleCreateRule} disabled={isLoading}>
                                {isLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                {ai?.createRule || dp?.createRule || 'Create Rule'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={clearConversation}
                              >
                                <X className="h-3 w-3 mr-1" />
                                {t.common.cancel}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {ai?.thinking || 'Thinking...'}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Inline reply input - shown when conversation is active and no pending rule */}
            {!pendingRule && !isLoading && messages.length > 0 && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  ref={replyInputRef}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && replyInput.trim() && handleReply(replyInput)}
                  placeholder={ai?.replyPlaceholder || 'Type your reply...'}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleReply(replyInput)}
                  disabled={!replyInput.trim()}
                  className="h-8 px-3 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 shrink-0 text-muted-foreground"
                  onClick={clearConversation}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
