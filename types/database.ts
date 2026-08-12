export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      connection_status: "pending" | "accepted" | "rejected" | "blocked";
      request_status: "active" | "fulfilled" | "expired" | "deleted";
      request_response_status: "interested" | "accepted" | "rejected";
      skill_level: "beginner" | "intermediate" | "advanced";
      report_reason: "spam" | "harassment" | "impersonation" | "inappropriate" | "scam" | "other";
    };
  };
};
