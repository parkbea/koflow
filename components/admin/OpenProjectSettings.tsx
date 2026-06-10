"use client";

import { useState } from "react";
import { Plug, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function OpenProjectSettings({
  initialBaseUrl,
  hasApiKey,
}: {
  initialBaseUrl: string;
  hasApiKey: boolean;
}) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [apiKey, setApiKey] = useState("");
  const [keySet, setKeySet] = useState(hasApiKey);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(test: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/integrations/openproject/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          apiKey: apiKey || undefined,
          test,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "실패" });
      } else {
        setKeySet(keySet || !!apiKey);
        setApiKey("");
        setMsg({
          ok: true,
          text: test
            ? `연결 성공 (${data.user ?? "OK"}) · 저장됨`
            : "저장되었습니다.",
        });
      }
    } catch {
      setMsg({ ok: false, text: "요청 실패" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">OpenProject 연동</p>
            <p className="text-xs text-muted-foreground">
              사내 OpenProject 서버 주소와 API 키를 등록하면 프로젝트 정보를
              가져올 수 있습니다.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>서버 URL</Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://openproject.company.local"
          />
        </div>

        <div className="space-y-2">
          <Label>
            API 키{" "}
            {keySet && (
              <span className="ml-1 text-xs text-emerald-600">
                (등록됨 — 변경 시에만 입력)
              </span>
            )}
          </Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keySet ? "••••••••  (유지하려면 비워두세요)" : "API access token"}
          />
          <p className="text-xs text-muted-foreground">
            OpenProject → 개인설정 → Access Tokens 에서 발급. 키는 서버에만
            저장되며 외부로 노출되지 않습니다.
          </p>
        </div>

        {msg && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              msg.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {msg.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {msg.text}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => send(true)} disabled={busy}>
            {busy ? "확인 중..." : "연결 테스트 & 저장"}
          </Button>
          <Button variant="outline" onClick={() => send(false)} disabled={busy}>
            저장만
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
