export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_email: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      agent_configs: {
        Row: {
          agent_id: string
          config: Json | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          last_status: string | null
          loop_interval_seconds: number | null
          sport: string
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          config?: Json | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          loop_interval_seconds?: number | null
          sport?: string
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          config?: Json | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          loop_interval_seconds?: number | null
          sport?: string
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          action: string
          agent_name: string
          article_id: string | null
          cache_read_tokens: number | null
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          kind: string | null
          level: string
          message: string
          model_used: string | null
          payload: Json | null
          task_id: string | null
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          action: string
          agent_name: string
          article_id?: string | null
          cache_read_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          kind?: string | null
          level?: string
          message: string
          model_used?: string | null
          payload?: Json | null
          task_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          action?: string
          agent_name?: string
          article_id?: string | null
          cache_read_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          kind?: string | null
          level?: string
          message?: string
          model_used?: string | null
          payload?: Json | null
          task_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          access_count: number
          agent_id: string
          category: string
          content: string
          created_at: string
          id: string
          importance_score: number
          last_updated_at: string
          metadata: Json
          tags: string[]
        }
        Insert: {
          access_count?: number
          agent_id: string
          category: string
          content: string
          created_at?: string
          id?: string
          importance_score?: number
          last_updated_at?: string
          metadata?: Json
          tags?: string[]
        }
        Update: {
          access_count?: number
          agent_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          importance_score?: number
          last_updated_at?: string
          metadata?: Json
          tags?: string[]
        }
        Relationships: []
      }
      agent_reports: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          hampus_responded_at: string | null
          hampus_response: string | null
          id: string
          report_type: string | null
          status: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          hampus_responded_at?: string | null
          hampus_response?: string | null
          id?: string
          report_type?: string | null
          status?: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          hampus_responded_at?: string | null
          hampus_response?: string | null
          id?: string
          report_type?: string | null
          status?: string
        }
        Relationships: []
      }
      agent_state: {
        Row: {
          agent_name: string
          created_at: string
          expires_at: string | null
          id: string
          key: string
          ttl_seconds: number | null
          updated_at: string
          value: Json
        }
        Insert: {
          agent_name: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          ttl_seconds?: number | null
          updated_at?: string
          value: Json
        }
        Update: {
          agent_name?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          ttl_seconds?: number | null
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ai_summaries: {
        Row: {
          clerk_user_id: string | null
          content: string
          estimated_cost_usd: number
          fixture_id: string | null
          generated_at: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          summary_type: string
          thread_id: string | null
        }
        Insert: {
          clerk_user_id?: string | null
          content: string
          estimated_cost_usd?: number
          fixture_id?: string | null
          generated_at?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          summary_type: string
          thread_id?: string | null
        }
        Update: {
          clerk_user_id?: string | null
          content?: string
          estimated_cost_usd?: number
          fixture_id?: string | null
          generated_at?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          summary_type?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summaries_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          approval_reason: string | null
          author: string | null
          content: string | null
          created_at: string
          duplicate_sources: string[]
          entity_ids: string[]
          event_type: string | null
          feed_reasons: string[]
          feed_score: number
          fingerprint: string | null
          generated_kind: string | null
          id: string
          importance_score: number | null
          is_athopia_generated: boolean
          is_processed: boolean
          is_style_template: boolean | null
          language: string
          manually_reviewed: boolean | null
          metadata: Json | null
          news_tag: string | null
          primary_article_id: string | null
          published_at: string | null
          push_priority: string
          relevance_reason: string | null
          relevance_status: string | null
          requires_admin_approval: boolean
          rights_status: string | null
          content_origin: string | null
          scrape_error: string | null
          scrape_status: string | null
          sentiment: string | null
          slug: string | null
          source_count: number
          source_id: string | null
          source_name: string | null
          sport: string | null
          status: string
          story_cluster_id: string | null
          style_tags: string[] | null
          summary: string | null
          team_tags: string[] | null
          template_rating: number | null
          title: string
          updated_at: string
          url: string
          url_hash: string
        }
        Insert: {
          approval_reason?: string | null
          author?: string | null
          content?: string | null
          content_origin?: string | null
          created_at?: string
          duplicate_sources?: string[]
          entity_ids?: string[]
          event_type?: string | null
          feed_reasons?: string[]
          feed_score?: number
          fingerprint?: string | null
          generated_kind?: string | null
          id?: string
          importance_score?: number | null
          is_athopia_generated?: boolean
          is_processed?: boolean
          is_style_template?: boolean | null
          language?: string
          manually_reviewed?: boolean | null
          metadata?: Json | null
          news_tag?: string | null
          primary_article_id?: string | null
          published_at?: string | null
          push_priority?: string
          relevance_reason?: string | null
          relevance_status?: string | null
          requires_admin_approval?: boolean
          rights_status?: string | null
          scrape_error?: string | null
          scrape_status?: string | null
          sentiment?: string | null
          slug?: string | null
          source_count?: number
          source_id?: string | null
          source_name?: string | null
          sport?: string | null
          status?: string
          story_cluster_id?: string | null
          style_tags?: string[] | null
          summary?: string | null
          team_tags?: string[] | null
          template_rating?: number | null
          title: string
          updated_at?: string
          url: string
          url_hash: string
        }
        Update: {
          approval_reason?: string | null
          author?: string | null
          content?: string | null
          content_origin?: string | null
          created_at?: string
          duplicate_sources?: string[]
          entity_ids?: string[]
          event_type?: string | null
          feed_reasons?: string[]
          feed_score?: number
          fingerprint?: string | null
          generated_kind?: string | null
          id?: string
          importance_score?: number | null
          is_athopia_generated?: boolean
          is_processed?: boolean
          is_style_template?: boolean | null
          language?: string
          manually_reviewed?: boolean | null
          metadata?: Json | null
          news_tag?: string | null
          primary_article_id?: string | null
          published_at?: string | null
          push_priority?: string
          relevance_reason?: string | null
          relevance_status?: string | null
          requires_admin_approval?: boolean
          rights_status?: string | null
          scrape_error?: string | null
          scrape_status?: string | null
          sentiment?: string | null
          slug?: string | null
          source_count?: number
          source_id?: string | null
          source_name?: string | null
          sport?: string | null
          status?: string
          story_cluster_id?: string | null
          style_tags?: string[] | null
          summary?: string | null
          team_tags?: string[] | null
          template_rating?: number | null
          title?: string
          updated_at?: string
          url?: string
          url_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_primary_article_id_fkey"
            columns: ["primary_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_primary_article_id_fkey"
            columns: ["primary_article_id"]
            isOneToOne: false
            referencedRelation: "news_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rss_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      article_research: {
        Row: {
          article_id: string
          full_text: string
          scraped_at: string
          scrape_status: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          full_text: string
          scraped_at?: string
          scrape_status?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          full_text?: string
          scraped_at?: string
          scrape_status?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_research_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_sources: {
        Row: {
          article_id: string
          created_at: string
          domain: string | null
          id: string
          is_primary: boolean
          original_url: string
          published_at: string | null
          source_name: string
        }
        Insert: {
          article_id: string
          created_at?: string
          domain?: string | null
          id?: string
          is_primary?: boolean
          original_url: string
          published_at?: string | null
          source_name: string
        }
        Update: {
          article_id?: string
          created_at?: string
          domain?: string | null
          id?: string
          is_primary?: boolean
          original_url?: string
          published_at?: string | null
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      athopia_ratings: {
        Row: {
          athopia_rating: number | null
          attacking_rating: number | null
          computed_at: string
          defensive_rating: number | null
          form_rating: number | null
          passing_rating: number | null
          physical_rating: number | null
          player_id: number
          season_id: number
        }
        Insert: {
          athopia_rating?: number | null
          attacking_rating?: number | null
          computed_at?: string
          defensive_rating?: number | null
          form_rating?: number | null
          passing_rating?: number | null
          physical_rating?: number | null
          player_id: number
          season_id: number
        }
        Update: {
          athopia_rating?: number | null
          attacking_rating?: number | null
          computed_at?: string
          defensive_rating?: number | null
          form_rating?: number | null
          passing_rating?: number | null
          physical_rating?: number | null
          player_id?: number
          season_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "athopia_ratings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      campaign_posts: {
        Row: {
          approved_at: string | null
          asset_urls: string[]
          campaign_id: string
          caption: string | null
          channel: string
          content_queue_id: string | null
          created_at: string
          day_index: number
          format: string
          generation_notes: string | null
          hashtags: string[]
          hook: string | null
          id: string
          metadata: Json
          phase: string | null
          posted_at: string | null
          posted_url: string | null
          preview_urls: string[]
          scheduled_date: string
          social_teaser_id: string | null
          sport: string
          status: string
          theme: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          asset_urls?: string[]
          campaign_id: string
          caption?: string | null
          channel: string
          content_queue_id?: string | null
          created_at?: string
          day_index: number
          format: string
          generation_notes?: string | null
          hashtags?: string[]
          hook?: string | null
          id?: string
          metadata?: Json
          phase?: string | null
          posted_at?: string | null
          posted_url?: string | null
          preview_urls?: string[]
          scheduled_date: string
          social_teaser_id?: string | null
          sport?: string
          status?: string
          theme: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          asset_urls?: string[]
          campaign_id?: string
          caption?: string | null
          channel?: string
          content_queue_id?: string | null
          created_at?: string
          day_index?: number
          format?: string
          generation_notes?: string | null
          hashtags?: string[]
          hook?: string | null
          id?: string
          metadata?: Json
          phase?: string | null
          posted_at?: string | null
          posted_url?: string | null
          preview_urls?: string[]
          scheduled_date?: string
          social_teaser_id?: string | null
          sport?: string
          status?: string
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          end_date: string
          goal: string | null
          id: string
          launch_date: string | null
          metadata: Json
          name: string
          sport: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          goal?: string | null
          id?: string
          launch_date?: string | null
          metadata?: Json
          name: string
          sport?: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goal?: string | null
          id?: string
          launch_date?: string | null
          metadata?: Json
          name?: string
          sport?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_cache: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          q_hash: string
          sources: Json | null
          sport: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          q_hash: string
          sources?: Json | null
          sport: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          q_hash?: string
          sources?: Json | null
          sport?: string
        }
        Relationships: []
      }
      chat_usage: {
        Row: {
          day: string
          msg_count: number
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Insert: {
          day?: string
          msg_count?: number
          tokens_in?: number
          tokens_out?: number
          user_id: string
        }
        Update: {
          day?: string
          msg_count?: number
          tokens_in?: number
          tokens_out?: number
          user_id?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          name: string | null
          nationality: string | null
          raw: Json | null
          sportmonks_id: number
        }
        Insert: {
          name?: string | null
          nationality?: string | null
          raw?: Json | null
          sportmonks_id: number
        }
        Update: {
          name?: string | null
          nationality?: string | null
          raw?: Json | null
          sportmonks_id?: number
        }
        Relationships: []
      }
      content_queue: {
        Row: {
          agent_source: string
          content: Json
          content_type: string
          created_at: string
          deduped_from: string | null
          entity_ids: string[] | null
          fingerprint: string | null
          guid: string | null
          id: string
          importance_tier: string | null
          injury_severity: string | null
          involves_xg: boolean | null
          metadata: Json | null
          news_tag: string | null
          published_at: string | null
          rejection_reason: string | null
          scheduled_for: string | null
          signal_score: number | null
          source_article_ids: string[]
          source_entity_ids: string[]
          source_name: string | null
          source_url: string | null
          sport: string | null
          status: string
          story_cluster_id: string | null
          title: string | null
          transfer_confidence: number | null
          updated_at: string
        }
        Insert: {
          agent_source: string
          content: Json
          content_type: string
          created_at?: string
          deduped_from?: string | null
          entity_ids?: string[] | null
          fingerprint?: string | null
          guid?: string | null
          id?: string
          importance_tier?: string | null
          injury_severity?: string | null
          involves_xg?: boolean | null
          metadata?: Json | null
          news_tag?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          signal_score?: number | null
          source_article_ids?: string[]
          source_entity_ids?: string[]
          source_name?: string | null
          source_url?: string | null
          sport?: string | null
          status?: string
          story_cluster_id?: string | null
          title?: string | null
          transfer_confidence?: number | null
          updated_at?: string
        }
        Update: {
          agent_source?: string
          content?: Json
          content_type?: string
          created_at?: string
          deduped_from?: string | null
          entity_ids?: string[] | null
          fingerprint?: string | null
          guid?: string | null
          id?: string
          importance_tier?: string | null
          injury_severity?: string | null
          involves_xg?: boolean | null
          metadata?: Json | null
          news_tag?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          signal_score?: number | null
          source_article_ids?: string[]
          source_entity_ids?: string[]
          source_name?: string | null
          source_url?: string | null
          sport?: string | null
          status?: string
          story_cluster_id?: string | null
          title?: string | null
          transfer_confidence?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_story_cluster_id_fkey"
            columns: ["story_cluster_id"]
            isOneToOne: false
            referencedRelation: "story_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          analytics: boolean
          anon_id: string | null
          clerk_user_id: string | null
          consented_at: string
          created_at: string | null
          id: string
          marketing: boolean
          necessary: boolean
          user_agent: string | null
          version: number
        }
        Insert: {
          analytics?: boolean
          anon_id?: string | null
          clerk_user_id?: string | null
          consented_at: string
          created_at?: string | null
          id?: string
          marketing?: boolean
          necessary?: boolean
          user_agent?: string | null
          version?: number
        }
        Update: {
          analytics?: boolean
          anon_id?: string | null
          clerk_user_id?: string | null
          consented_at?: string
          created_at?: string | null
          id?: string
          marketing?: boolean
          necessary?: boolean
          user_agent?: string | null
          version?: number
        }
        Relationships: []
      }
      data_version: {
        Row: {
          sport: string
          version: number
        }
        Insert: {
          sport: string
          version?: number
        }
        Update: {
          sport?: string
          version?: number
        }
        Relationships: []
      }
      decisions: {
        Row: {
          created_at: string
          description: string
          id: string
          outcome: string | null
          rationale: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          outcome?: string | null
          rationale?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          outcome?: string | null
          rationale?: string | null
          title?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          content_id: string
          content_type: string
          created_at: string
          embedding: string | null
          id: string
          model: string
        }
        Insert: {
          chunk_index?: number
          chunk_text: string
          content_id: string
          content_type: string
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          content_id?: string
          content_type?: string
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          aliases: string[]
          created_at: string
          embedding_id: string | null
          id: string
          metadata: Json | null
          name: string
          slug: string | null
          sportmonks_id: number | null
          sportsmonks_id: number | null
          type: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          embedding_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          slug?: string | null
          sportmonks_id?: number | null
          sportsmonks_id?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          embedding_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string | null
          sportmonks_id?: number | null
          sportsmonks_id?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_embedding_id_fk"
            columns: ["embedding_id"]
            isOneToOne: false
            referencedRelation: "embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_insights: {
        Row: {
          body: string | null
          confidence: number
          created_at: string
          entity_id: string
          entity_type: string
          evidence: Json
          expires_at: string | null
          generated_at: string
          generated_by: string
          id: string
          insight_key: string
          insight_type: string
          metric_snapshot: Json
          severity: string
          source_article_ids: string[]
          source_fixture_ids: number[]
          sport: string
          status: string
          summary: string
          title: string
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          body?: string | null
          confidence: number
          created_at?: string
          entity_id: string
          entity_type?: string
          evidence?: Json
          expires_at?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          insight_key: string
          insight_type: string
          metric_snapshot?: Json
          severity?: string
          source_article_ids?: string[]
          source_fixture_ids?: number[]
          sport?: string
          status?: string
          summary: string
          title: string
          updated_at?: string
          window_end?: string
          window_start: string
        }
        Update: {
          body?: string | null
          confidence?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          evidence?: Json
          expires_at?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          insight_key?: string
          insight_type?: string
          metric_snapshot?: Json
          severity?: string
          source_article_ids?: string[]
          source_fixture_ids?: number[]
          sport?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_insights_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          article_ids: string[]
          created_at: string
          description: string | null
          entity_ids: string[]
          event_type: string
          fingerprint: string
          id: string
          importance_score: number | null
          metadata: Json | null
          occurred_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          article_ids?: string[]
          created_at?: string
          description?: string | null
          entity_ids?: string[]
          event_type: string
          fingerprint: string
          id?: string
          importance_score?: number | null
          metadata?: Json | null
          occurred_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          article_ids?: string[]
          created_at?: string
          description?: string | null
          entity_ids?: string[]
          event_type?: string
          fingerprint?: string
          id?: string
          importance_score?: number | null
          metadata?: Json | null
          occurred_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fan_leagues: {
        Row: {
          created_at: string | null
          id: string
          team_color: string
          team_name: string
          team_slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_color?: string
          team_name: string
          team_slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_color?: string
          team_name?: string
          team_slug?: string
        }
        Relationships: []
      }
      fixture_events: {
        Row: {
          event_type: string | null
          extra: Json | null
          extra_minute: number | null
          fixture_id: number
          minute: number | null
          player_id: number | null
          related_player_id: number | null
          result: string | null
          sportmonks_id: number
          team_id: number | null
        }
        Insert: {
          event_type?: string | null
          extra?: Json | null
          extra_minute?: number | null
          fixture_id: number
          minute?: number | null
          player_id?: number | null
          related_player_id?: number | null
          result?: string | null
          sportmonks_id: number
          team_id?: number | null
        }
        Update: {
          event_type?: string | null
          extra?: Json | null
          extra_minute?: number | null
          fixture_id?: number
          minute?: number | null
          player_id?: number | null
          related_player_id?: number | null
          result?: string | null
          sportmonks_id?: number
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixture_events_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      fixture_lineups: {
        Row: {
          fixture_id: number
          formation_position: string | null
          jersey: number | null
          minutes: number | null
          player_id: number
          position: string | null
          starter: boolean | null
          team_id: number | null
        }
        Insert: {
          fixture_id: number
          formation_position?: string | null
          jersey?: number | null
          minutes?: number | null
          player_id: number
          position?: string | null
          starter?: boolean | null
          team_id?: number | null
        }
        Update: {
          fixture_id?: number
          formation_position?: string | null
          jersey?: number | null
          minutes?: number | null
          player_id?: number
          position?: string | null
          starter?: boolean | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixture_lineups_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      fixtures: {
        Row: {
          attendance: number | null
          away_entity_id: string | null
          away_score: number | null
          away_team_id: number | null
          away_team_name: string
          competition: string | null
          created_at: string
          home_entity_id: string | null
          home_score: number | null
          home_team_id: number
          home_team_name: string
          id: string
          kickoff: string | null
          kickoff_at: string
          league_id: number | null
          match_thread_id: string | null
          raw: Json | null
          referee: string | null
          round: number | null
          season: string | null
          season_id: number | null
          sport: string
          sportmonks_id: number | null
          status: string | null
          updated_at: string | null
          venue_id: number | null
          weather: Json | null
        }
        Insert: {
          attendance?: number | null
          away_entity_id?: string | null
          away_score?: number | null
          away_team_id?: number | null
          away_team_name: string
          competition?: string | null
          created_at?: string
          home_entity_id?: string | null
          home_score?: number | null
          home_team_id: number
          home_team_name: string
          id?: string
          kickoff?: string | null
          kickoff_at: string
          league_id?: number | null
          match_thread_id?: string | null
          raw?: Json | null
          referee?: string | null
          round?: number | null
          season?: string | null
          season_id?: number | null
          sport?: string
          sportmonks_id?: number | null
          status?: string | null
          updated_at?: string | null
          venue_id?: number | null
          weather?: Json | null
        }
        Update: {
          attendance?: number | null
          away_entity_id?: string | null
          away_score?: number | null
          away_team_id?: number | null
          away_team_name?: string
          competition?: string | null
          created_at?: string
          home_entity_id?: string | null
          home_score?: number | null
          home_team_id?: number
          home_team_name?: string
          id?: string
          kickoff?: string | null
          kickoff_at?: string
          league_id?: number | null
          match_thread_id?: string | null
          raw?: Json | null
          referee?: string | null
          round?: number | null
          season?: string | null
          season_id?: number | null
          sport?: string
          sportmonks_id?: number | null
          status?: string | null
          updated_at?: string | null
          venue_id?: number | null
          weather?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_entity_id_fkey"
            columns: ["away_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["sportmonks_id"]
          },
          {
            foreignKeyName: "fixtures_home_entity_id_fkey"
            columns: ["home_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["sportmonks_id"]
          },
          {
            foreignKeyName: "fixtures_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["sportmonks_id"]
          },
          {
            foreignKeyName: "fixtures_match_thread_fk"
            columns: ["match_thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          ai_summary: string | null
          ai_summary_updated_at: string | null
          author_avatar: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          depth: number | null
          hot_score: number | null
          id: string
          images: string[] | null
          label: string | null
          like_count: number | null
          parent_id: string | null
          pinned: boolean | null
          quoted_post_id: string | null
          reply_count: number | null
          repost_count: number | null
          root_id: string | null
          sport: string | null
          status: string | null
          team_slug: string | null
          view_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          author_avatar?: string | null
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          depth?: number | null
          hot_score?: number | null
          id?: string
          images?: string[] | null
          label?: string | null
          like_count?: number | null
          parent_id?: string | null
          pinned?: boolean | null
          quoted_post_id?: string | null
          reply_count?: number | null
          repost_count?: number | null
          root_id?: string | null
          sport?: string | null
          status?: string | null
          team_slug?: string | null
          view_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          author_avatar?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          depth?: number | null
          hot_score?: number | null
          id?: string
          images?: string[] | null
          label?: string | null
          like_count?: number | null
          parent_id?: string | null
          pinned?: boolean | null
          quoted_post_id?: string | null
          reply_count?: number | null
          repost_count?: number | null
          root_id?: string | null
          sport?: string | null
          status?: string | null
          team_slug?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_quoted_post_id_fkey"
            columns: ["quoted_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_root_id_fkey"
            columns: ["root_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          flagged: boolean | null
          id: string
          likes: number | null
          thread_id: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          flagged?: boolean | null
          id?: string
          likes?: number | null
          thread_id?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          flagged?: boolean | null
          id?: string
          likes?: number | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reposts: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          hot_score: number | null
          id: string
          last_reply_at: string | null
          locked: boolean | null
          pinned: boolean | null
          reply_count: number | null
          team_id: string | null
          title: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          hot_score?: number | null
          id?: string
          last_reply_at?: string | null
          locked?: boolean | null
          pinned?: boolean | null
          reply_count?: number | null
          team_id?: string | null
          title: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          hot_score?: number | null
          id?: string
          last_reply_at?: string | null
          locked?: boolean | null
          pinned?: boolean | null
          reply_count?: number | null
          team_id?: string | null
          title?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_todos: {
        Row: {
          auto_generated: boolean | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          done: boolean | null
          id: string
          priority: number | null
          source: string | null
          summary: string | null
          title: string
        }
        Insert: {
          auto_generated?: boolean | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          done?: boolean | null
          id?: string
          priority?: number | null
          source?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          auto_generated?: boolean | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          done?: boolean | null
          id?: string
          priority?: number | null
          source?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      golf_players: {
        Row: {
          bio: string | null
          birth_year: number | null
          created_at: string | null
          id: string
          name: string
          nationality: string | null
          profile_image_url: string | null
          slug: string
          sport: string
          tour: string | null
          updated_at: string
          world_ranking: number | null
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string | null
          id?: string
          name: string
          nationality?: string | null
          profile_image_url?: string | null
          slug: string
          sport?: string
          tour?: string | null
          updated_at?: string
          world_ranking?: number | null
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string | null
          id?: string
          name?: string
          nationality?: string | null
          profile_image_url?: string | null
          slug?: string
          sport?: string
          tour?: string | null
          updated_at?: string
          world_ranking?: number | null
        }
        Relationships: []
      }
      golf_results: {
        Row: {
          created_at: string | null
          earnings_usd: number | null
          id: string
          player_slug: string | null
          position: number | null
          rounds: Json | null
          score: number | null
          tournament_slug: string | null
        }
        Insert: {
          created_at?: string | null
          earnings_usd?: number | null
          id?: string
          player_slug?: string | null
          position?: number | null
          rounds?: Json | null
          score?: number | null
          tournament_slug?: string | null
        }
        Update: {
          created_at?: string | null
          earnings_usd?: number | null
          id?: string
          player_slug?: string | null
          position?: number | null
          rounds?: Json | null
          score?: number | null
          tournament_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "golf_results_player_slug_fkey"
            columns: ["player_slug"]
            isOneToOne: false
            referencedRelation: "golf_players"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "golf_results_tournament_slug_fkey"
            columns: ["tournament_slug"]
            isOneToOne: false
            referencedRelation: "golf_tournaments"
            referencedColumns: ["slug"]
          },
        ]
      }
      golf_tournaments: {
        Row: {
          country: string | null
          course: string | null
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          purse_usd: number | null
          slug: string
          sport: string
          start_date: string | null
          status: string | null
          tour: string | null
        }
        Insert: {
          country?: string | null
          course?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          purse_usd?: number | null
          slug: string
          sport?: string
          start_date?: string | null
          status?: string | null
          tour?: string | null
        }
        Update: {
          country?: string | null
          course?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          purse_usd?: number | null
          slug?: string
          sport?: string
          start_date?: string | null
          status?: string | null
          tour?: string | null
        }
        Relationships: []
      }
      inspiration_items: {
        Row: {
          angle: string | null
          created_at: string
          entity_ids: string[] | null
          headline: string
          id: string
          idea: string | null
          source_name: string | null
          sport: string
          stat_refs: Json | null
          status: string
          url: string
        }
        Insert: {
          angle?: string | null
          created_at?: string
          entity_ids?: string[] | null
          headline: string
          id?: string
          idea?: string | null
          source_name?: string | null
          sport?: string
          stat_refs?: Json | null
          status?: string
          url: string
        }
        Update: {
          angle?: string | null
          created_at?: string
          entity_ids?: string[] | null
          headline?: string
          id?: string
          idea?: string | null
          source_name?: string | null
          sport?: string
          stat_refs?: Json | null
          status?: string
          url?: string
        }
        Relationships: []
      }
      iq_history: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          id: string
          iq_score: number
          rank_in_league: number | null
          week_number: number
          year: number
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          id?: string
          iq_score: number
          rank_in_league?: number | null
          week_number: number
          year: number
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          id?: string
          iq_score?: number
          rank_in_league?: number | null
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      leagues: {
        Row: {
          country: string | null
          logo: string | null
          name: string
          sport: string
          sportmonks_id: number
          updated_at: string
        }
        Insert: {
          country?: string | null
          logo?: string | null
          name: string
          sport?: string
          sportmonks_id: number
          updated_at?: string
        }
        Update: {
          country?: string | null
          logo?: string | null
          name?: string
          sport?: string
          sportmonks_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      live_scores: {
        Row: {
          away_score: number | null
          events: Json | null
          fixture_id: number
          home_score: number | null
          minute: number | null
          sport: string
          updated_at: string | null
        }
        Insert: {
          away_score?: number | null
          events?: Json | null
          fixture_id: number
          home_score?: number | null
          minute?: number | null
          sport: string
          updated_at?: string | null
        }
        Update: {
          away_score?: number | null
          events?: Json | null
          fixture_id?: number
          home_score?: number | null
          minute?: number | null
          sport?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      match_cards: {
        Row: {
          actual_away_goals: number | null
          actual_home_goals: number | null
          actual_outcome: string | null
          away_team: string
          badge_earned: string | null
          clerk_user_id: string
          created_at: string | null
          home_team: string
          id: string
          iq_points_earned: number | null
          is_rare_outcome: boolean | null
          is_revealed: boolean | null
          match_date: string
          match_id: string
          outcome_correct: boolean | null
          predicted_at: string | null
          prediction_away_goals: number | null
          prediction_home_goals: number | null
          prediction_outcome: string | null
          reveal_at: string | null
          score_correct: boolean | null
        }
        Insert: {
          actual_away_goals?: number | null
          actual_home_goals?: number | null
          actual_outcome?: string | null
          away_team: string
          badge_earned?: string | null
          clerk_user_id: string
          created_at?: string | null
          home_team: string
          id?: string
          iq_points_earned?: number | null
          is_rare_outcome?: boolean | null
          is_revealed?: boolean | null
          match_date: string
          match_id: string
          outcome_correct?: boolean | null
          predicted_at?: string | null
          prediction_away_goals?: number | null
          prediction_home_goals?: number | null
          prediction_outcome?: string | null
          reveal_at?: string | null
          score_correct?: boolean | null
        }
        Update: {
          actual_away_goals?: number | null
          actual_home_goals?: number | null
          actual_outcome?: string | null
          away_team?: string
          badge_earned?: string | null
          clerk_user_id?: string
          created_at?: string | null
          home_team?: string
          id?: string
          iq_points_earned?: number | null
          is_rare_outcome?: boolean | null
          is_revealed?: boolean | null
          match_date?: string
          match_id?: string
          outcome_correct?: boolean | null
          predicted_at?: string | null
          prediction_away_goals?: number | null
          prediction_home_goals?: number | null
          prediction_outcome?: string | null
          reveal_at?: string | null
          score_correct?: boolean | null
        }
        Relationships: []
      }
      match_rounds: {
        Row: {
          end_date: string
          id: string
          is_active: boolean | null
          round_number: number
          season: number
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          is_active?: boolean | null
          round_number: number
          season?: number
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          is_active?: boolean | null
          round_number?: number
          season?: number
          start_date?: string
        }
        Relationships: []
      }
      match_stats: {
        Row: {
          analyzed_at: string | null
          away_corners: number | null
          away_fouls: number | null
          away_possession: number | null
          away_red_cards: number | null
          away_score: number
          away_shots: number | null
          away_shots_on_target: number | null
          away_sportsmonks_id: number | null
          away_team_name: string
          away_xg: number | null
          away_yellow_cards: number | null
          created_at: string
          fixture_id: number
          home_corners: number | null
          home_fouls: number | null
          home_possession: number | null
          home_red_cards: number | null
          home_score: number
          home_shots: number | null
          home_shots_on_target: number | null
          home_sportsmonks_id: number | null
          home_team_name: string
          home_xg: number | null
          home_yellow_cards: number | null
          id: string
          milo_analyzed: boolean
          played_at: string | null
          raw_data: Json | null
          season_id: number
          updated_at: string
        }
        Insert: {
          analyzed_at?: string | null
          away_corners?: number | null
          away_fouls?: number | null
          away_possession?: number | null
          away_red_cards?: number | null
          away_score?: number
          away_shots?: number | null
          away_shots_on_target?: number | null
          away_sportsmonks_id?: number | null
          away_team_name: string
          away_xg?: number | null
          away_yellow_cards?: number | null
          created_at?: string
          fixture_id: number
          home_corners?: number | null
          home_fouls?: number | null
          home_possession?: number | null
          home_red_cards?: number | null
          home_score?: number
          home_shots?: number | null
          home_shots_on_target?: number | null
          home_sportsmonks_id?: number | null
          home_team_name: string
          home_xg?: number | null
          home_yellow_cards?: number | null
          id?: string
          milo_analyzed?: boolean
          played_at?: string | null
          raw_data?: Json | null
          season_id: number
          updated_at?: string
        }
        Update: {
          analyzed_at?: string | null
          away_corners?: number | null
          away_fouls?: number | null
          away_possession?: number | null
          away_red_cards?: number | null
          away_score?: number
          away_shots?: number | null
          away_shots_on_target?: number | null
          away_sportsmonks_id?: number | null
          away_team_name?: string
          away_xg?: number | null
          away_yellow_cards?: number | null
          created_at?: string
          fixture_id?: number
          home_corners?: number | null
          home_fouls?: number | null
          home_possession?: number | null
          home_red_cards?: number | null
          home_score?: number
          home_shots?: number | null
          home_shots_on_target?: number | null
          home_sportsmonks_id?: number | null
          home_team_name?: string
          home_xg?: number | null
          home_yellow_cards?: number | null
          id?: string
          milo_analyzed?: boolean
          played_at?: string | null
          raw_data?: Json | null
          season_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      match_summaries: {
        Row: {
          fixture_id: number
          generated_at: string | null
          model: string | null
          summary: string
        }
        Insert: {
          fixture_id: number
          generated_at?: string | null
          model?: string | null
          summary: string
        }
        Update: {
          fixture_id?: number
          generated_at?: string | null
          model?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_summaries_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "fixtures"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      media_assets: {
        Row: {
          asset_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          height: number | null
          id: string
          metadata: Json
          mime_type: string | null
          policy: string
          provider: string
          public_url: string | null
          source_url: string | null
          storage_path: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          asset_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          policy?: string
          provider?: string
          public_url?: string | null
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          asset_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          policy?: string
          provider?: string
          public_url?: string | null
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      narratives: {
        Row: {
          article_ids: string[]
          created_at: string
          description: string | null
          entity_ids: string[]
          event_ids: string[]
          first_seen_at: string
          generated_text: string | null
          id: string
          importance_score: number | null
          last_updated_at: string
          metadata: Json | null
          source_count: number
          sport: string
          status: string
          title: string
          window_slot: string | null
        }
        Insert: {
          article_ids?: string[]
          created_at?: string
          description?: string | null
          entity_ids?: string[]
          event_ids?: string[]
          first_seen_at?: string
          generated_text?: string | null
          id?: string
          importance_score?: number | null
          last_updated_at?: string
          metadata?: Json | null
          source_count?: number
          sport?: string
          status?: string
          title: string
          window_slot?: string | null
        }
        Update: {
          article_ids?: string[]
          created_at?: string
          description?: string | null
          entity_ids?: string[]
          event_ids?: string[]
          first_seen_at?: string
          generated_text?: string | null
          id?: string
          importance_score?: number | null
          last_updated_at?: string
          metadata?: Json | null
          source_count?: number
          sport?: string
          status?: string
          title?: string
          window_slot?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          actor_name: string | null
          created_at: string | null
          id: string
          post_id: string | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          actor_name?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          actor_name?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          aerial_duels: number | null
          assists: number
          big_chances_created: number | null
          big_chances_missed: number | null
          clearances: number | null
          created_at: string
          crosses: number | null
          dribbles: number | null
          duels: number | null
          fixture_id: number
          fouls: number | null
          goals: number
          id: string
          interceptions: number | null
          key_passes: number | null
          minutes_played: number | null
          offsides: number | null
          pass_accuracy: number | null
          passes: number | null
          player_id: number | null
          player_name: string
          rating: number | null
          raw_data: Json | null
          red_cards: number
          shots: number | null
          shots_on_target: number | null
          sportsmonks_player_id: number
          sportsmonks_team_id: number | null
          tackles: number | null
          team_id: number | null
          team_name: string
          xa: number | null
          xg: number | null
          xgot: number | null
          yellow_cards: number
        }
        Insert: {
          aerial_duels?: number | null
          assists?: number
          big_chances_created?: number | null
          big_chances_missed?: number | null
          clearances?: number | null
          created_at?: string
          crosses?: number | null
          dribbles?: number | null
          duels?: number | null
          fixture_id: number
          fouls?: number | null
          goals?: number
          id?: string
          interceptions?: number | null
          key_passes?: number | null
          minutes_played?: number | null
          offsides?: number | null
          pass_accuracy?: number | null
          passes?: number | null
          player_id?: number | null
          player_name?: string
          rating?: number | null
          raw_data?: Json | null
          red_cards?: number
          shots?: number | null
          shots_on_target?: number | null
          sportsmonks_player_id: number
          sportsmonks_team_id?: number | null
          tackles?: number | null
          team_id?: number | null
          team_name?: string
          xa?: number | null
          xg?: number | null
          xgot?: number | null
          yellow_cards?: number
        }
        Update: {
          aerial_duels?: number | null
          assists?: number
          big_chances_created?: number | null
          big_chances_missed?: number | null
          clearances?: number | null
          created_at?: string
          crosses?: number | null
          dribbles?: number | null
          duels?: number | null
          fixture_id?: number
          fouls?: number | null
          goals?: number
          id?: string
          interceptions?: number | null
          key_passes?: number | null
          minutes_played?: number | null
          offsides?: number | null
          pass_accuracy?: number | null
          passes?: number | null
          player_id?: number | null
          player_name?: string
          rating?: number | null
          raw_data?: Json | null
          red_cards?: number
          shots?: number | null
          shots_on_target?: number | null
          sportsmonks_player_id?: number
          sportsmonks_team_id?: number | null
          tackles?: number | null
          team_id?: number | null
          team_name?: string
          xa?: number | null
          xg?: number | null
          xgot?: number | null
          yellow_cards?: number
        }
        Relationships: []
      }
      player_season_stats: {
        Row: {
          appearances: number
          assists: number
          assists_per_90: number | null
          clean_sheets: number | null
          clearances: number | null
          computed_at: string
          dribbles: number | null
          fouls: number | null
          goals: number
          goals_per_90: number | null
          interceptions: number | null
          key_passes: number | null
          minutes: number
          pass_accuracy: number | null
          passes: number | null
          player_id: number
          rating: number | null
          red_cards: number | null
          season_id: number
          shots: number | null
          shots_on_target: number | null
          tackles: number | null
          team_id: number | null
          xa: number | null
          xa_per_90: number | null
          xg: number | null
          xg_per_90: number | null
          yellow_cards: number | null
        }
        Insert: {
          appearances?: number
          assists?: number
          assists_per_90?: number | null
          clean_sheets?: number | null
          clearances?: number | null
          computed_at?: string
          dribbles?: number | null
          fouls?: number | null
          goals?: number
          goals_per_90?: number | null
          interceptions?: number | null
          key_passes?: number | null
          minutes?: number
          pass_accuracy?: number | null
          passes?: number | null
          player_id: number
          rating?: number | null
          red_cards?: number | null
          season_id: number
          shots?: number | null
          shots_on_target?: number | null
          tackles?: number | null
          team_id?: number | null
          xa?: number | null
          xa_per_90?: number | null
          xg?: number | null
          xg_per_90?: number | null
          yellow_cards?: number | null
        }
        Update: {
          appearances?: number
          assists?: number
          assists_per_90?: number | null
          clean_sheets?: number | null
          clearances?: number | null
          computed_at?: string
          dribbles?: number | null
          fouls?: number | null
          goals?: number
          goals_per_90?: number | null
          interceptions?: number | null
          key_passes?: number | null
          minutes?: number
          pass_accuracy?: number | null
          passes?: number | null
          player_id?: number
          rating?: number | null
          red_cards?: number | null
          season_id?: number
          shots?: number | null
          shots_on_target?: number | null
          tackles?: number | null
          team_id?: number | null
          xa?: number | null
          xa_per_90?: number | null
          xg?: number | null
          xg_per_90?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["sportmonks_id"]
          },
          {
            foreignKeyName: "player_season_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      players: {
        Row: {
          birthdate: string | null
          detailed_position: string | null
          firstname: string | null
          fullname: string | null
          height: number | null
          image: string | null
          lastname: string | null
          nationality: string | null
          position: string | null
          slug: string | null
          sport: string
          sportmonks_id: number
          team_id: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          birthdate?: string | null
          detailed_position?: string | null
          firstname?: string | null
          fullname?: string | null
          height?: number | null
          image?: string | null
          lastname?: string | null
          nationality?: string | null
          position?: string | null
          slug?: string | null
          sport?: string
          sportmonks_id: number
          team_id?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          birthdate?: string | null
          detailed_position?: string | null
          firstname?: string | null
          fullname?: string | null
          height?: number | null
          image?: string | null
          lastname?: string | null
          nationality?: string | null
          position?: string | null
          slug?: string | null
          sport?: string
          sportmonks_id?: number
          team_id?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      podcast_chunks: {
        Row: {
          chunk_index: number
          created_at: string
          embedding_id: string | null
          end_seconds: number | null
          id: string
          podcast_id: string
          start_seconds: number | null
          text: string
        }
        Insert: {
          chunk_index: number
          created_at?: string
          embedding_id?: string | null
          end_seconds?: number | null
          id?: string
          podcast_id: string
          start_seconds?: number | null
          text: string
        }
        Update: {
          chunk_index?: number
          created_at?: string
          embedding_id?: string | null
          end_seconds?: number | null
          id?: string
          podcast_id?: string
          start_seconds?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_chunks_embedding_id_fk"
            columns: ["embedding_id"]
            isOneToOne: false
            referencedRelation: "embeddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_chunks_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          audio_url: string
          created_at: string
          deepgram_job_id: string | null
          description: string | null
          duration_seconds: number | null
          entity_ids: string[]
          id: string
          is_processed: boolean
          is_transcribed: boolean
          language: string
          mentioned_teams: string[]
          metadata: Json | null
          published_at: string | null
          show_name: string | null
          source_id: string | null
          source_name: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          deepgram_job_id?: string | null
          description?: string | null
          duration_seconds?: number | null
          entity_ids?: string[]
          id?: string
          is_processed?: boolean
          is_transcribed?: boolean
          language?: string
          mentioned_teams?: string[]
          metadata?: Json | null
          published_at?: string | null
          show_name?: string | null
          source_id?: string | null
          source_name?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          deepgram_job_id?: string | null
          description?: string | null
          duration_seconds?: number | null
          entity_ids?: string[]
          id?: string
          is_processed?: boolean
          is_transcribed?: boolean
          language?: string
          mentioned_teams?: string[]
          metadata?: Json | null
          published_at?: string | null
          show_name?: string | null
          source_id?: string | null
          source_name?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcasts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rss_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string
          clerk_user_id: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          body: string
          clerk_user_id: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          body?: string
          clerk_user_id?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          clerk_user_id: string
          created_at: string
          display_name: string | null
          favourite_team_id: string | null
          feed_team_filter: string[] | null
          id: string
          nickname: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          clerk_user_id: string
          created_at?: string
          display_name?: string | null
          favourite_team_id?: string | null
          feed_team_filter?: string[] | null
          id?: string
          nickname?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          clerk_user_id?: string
          created_at?: string
          display_name?: string | null
          favourite_team_id?: string | null
          feed_team_filter?: string[] | null
          id?: string
          nickname?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      push_candidates: {
        Row: {
          article_id: string | null
          body: string
          created_at: string
          event_type: string | null
          feed_score: number | null
          id: string
          importance_score: number | null
          metadata: Json
          news_tag: string | null
          requires_admin_approval: boolean
          source_name: string | null
          sport: string
          status: string
          story_key: string
          surface: string
          team_entity_id: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          article_id?: string | null
          body: string
          created_at?: string
          event_type?: string | null
          feed_score?: number | null
          id?: string
          importance_score?: number | null
          metadata?: Json
          news_tag?: string | null
          requires_admin_approval?: boolean
          source_name?: string | null
          sport?: string
          status?: string
          story_key: string
          surface?: string
          team_entity_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          article_id?: string | null
          body?: string
          created_at?: string
          event_type?: string | null
          feed_score?: number | null
          id?: string
          importance_score?: number | null
          metadata?: Json
          news_tag?: string | null
          requires_admin_approval?: boolean
          source_name?: string | null
          sport?: string
          status?: string
          story_key?: string
          surface?: string
          team_entity_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_candidates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_candidates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_candidates_team_entity_id_fkey"
            columns: ["team_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          clerk_user_id: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string
          sport: string
          team_ids: string[]
          updated_at: string
        }
        Insert: {
          auth: string
          clerk_user_id: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh: string
          sport?: string
          team_ids?: string[]
          updated_at?: string
        }
        Update: {
          auth?: string
          clerk_user_id?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string
          sport?: string
          team_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      pushed_stories: {
        Row: {
          article_id: string | null
          sent_at: string
          story_key: string
        }
        Insert: {
          article_id?: string | null
          sent_at?: string
          story_key: string
        }
        Update: {
          article_id?: string | null
          sent_at?: string
          story_key?: string
        }
        Relationships: []
      }
      raw_coaches: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_fixtures: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_players: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_squads: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_standings: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_statistics: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_teams: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_transfers: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      raw_venues: {
        Row: {
          fetched_at: string
          json_data: Json
          sportmonks_id: number
        }
        Insert: {
          fetched_at?: string
          json_data: Json
          sportmonks_id: number
        }
        Update: {
          fetched_at?: string
          json_data?: Json
          sportmonks_id?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          clerk_user_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      round_ring_progress: {
        Row: {
          clerk_user_id: string
          completed_at: string | null
          id: string
          read_match_report: boolean | null
          read_preview: boolean | null
          read_statistics: boolean | null
          ring_completed: boolean | null
          round_id: string
        }
        Insert: {
          clerk_user_id: string
          completed_at?: string | null
          id?: string
          read_match_report?: boolean | null
          read_preview?: boolean | null
          read_statistics?: boolean | null
          ring_completed?: boolean | null
          round_id: string
        }
        Update: {
          clerk_user_id?: string
          completed_at?: string | null
          id?: string
          read_match_report?: boolean | null
          read_preview?: boolean | null
          read_statistics?: boolean | null
          ring_completed?: boolean | null
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_ring_progress_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "match_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_sources: {
        Row: {
          active: boolean
          category: string
          created_at: string
          error_count: number
          external_id: string
          fetch_count: number
          id: string
          language: string
          last_fetched_at: string | null
          name: string
          purpose: string
          sport: string | null
          trust_score: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          error_count?: number
          external_id: string
          fetch_count?: number
          id?: string
          language?: string
          last_fetched_at?: string | null
          name: string
          purpose?: string
          sport?: string | null
          trust_score?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          error_count?: number
          external_id?: string
          fetch_count?: number
          id?: string
          language?: string
          last_fetched_at?: string | null
          name?: string
          purpose?: string
          sport?: string | null
          trust_score?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          end_date: string | null
          is_current: boolean
          league_id: number | null
          name: string
          sport: string
          sportmonks_id: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          end_date?: string | null
          is_current?: boolean
          league_id?: number | null
          name: string
          sport?: string
          sportmonks_id: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          end_date?: string | null
          is_current?: boolean
          league_id?: number | null
          name?: string
          sport?: string
          sportmonks_id?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      sm_normalize_queue: {
        Row: {
          done_at: string | null
          error: string | null
          queued_at: string
          raw_table: string
          sportmonks_id: number
        }
        Insert: {
          done_at?: string | null
          error?: string | null
          queued_at?: string
          raw_table: string
          sportmonks_id: number
        }
        Update: {
          done_at?: string | null
          error?: string | null
          queued_at?: string
          raw_table?: string
          sportmonks_id?: number
        }
        Relationships: []
      }
      sm_sync_state: {
        Row: {
          cursor: string | null
          etag: string | null
          last_synced_at: string | null
          resource: string
          sport: string
          updated_at: string | null
        }
        Insert: {
          cursor?: string | null
          etag?: string | null
          last_synced_at?: string | null
          resource: string
          sport: string
          updated_at?: string | null
        }
        Update: {
          cursor?: string | null
          etag?: string | null
          last_synced_at?: string | null
          resource?: string
          sport?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string
          content_queue_id: string | null
          created_at: string
          error: string | null
          id: string
          media_urls: string[]
          metadata: Json | null
          platform: string
          platform_post_id: string | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
        }
        Insert: {
          content: string
          content_queue_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          media_urls?: string[]
          metadata?: Json | null
          platform: string
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_queue_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          media_urls?: string[]
          metadata?: Json | null
          platform?: string
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_content_queue_id_fkey"
            columns: ["content_queue_id"]
            isOneToOne: false
            referencedRelation: "content_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      social_teaser_sources: {
        Row: {
          article_id: string
          created_at: string
          id: string
          rank: number
          reason: string | null
          scores: Json
          story_group: string | null
          teaser_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          rank: number
          reason?: string | null
          scores?: Json
          story_group?: string | null
          teaser_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          rank?: number
          reason?: string | null
          scores?: Json
          story_group?: string | null
          teaser_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_teaser_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_teaser_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_teaser_sources_teaser_id_fkey"
            columns: ["teaser_id"]
            isOneToOne: false
            referencedRelation: "social_teasers"
            referencedColumns: ["id"]
          },
        ]
      }
      social_teasers: {
        Row: {
          alt_text: string
          caption: string
          comment_keyword: string
          confidence_level: string
          created_at: string
          design_preset: string
          generation_notes: string | null
          hook: string
          id: string
          mp4_urls: string[]
          png_urls: string[]
          post_date: string
          posted_at: string | null
          posted_url: string | null
          preview_urls: string[]
          quality_score: number | null
          ready_at: string | null
          seo_description: string
          slide_json: Json
          source_article_ids: string[]
          status: string
          suggested_publish_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          alt_text: string
          caption: string
          comment_keyword?: string
          confidence_level?: string
          created_at?: string
          design_preset?: string
          generation_notes?: string | null
          hook: string
          id?: string
          mp4_urls?: string[]
          png_urls?: string[]
          post_date: string
          posted_at?: string | null
          posted_url?: string | null
          preview_urls?: string[]
          quality_score?: number | null
          ready_at?: string | null
          seo_description: string
          slide_json: Json
          source_article_ids?: string[]
          status?: string
          suggested_publish_at?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          caption?: string
          comment_keyword?: string
          confidence_level?: string
          created_at?: string
          design_preset?: string
          generation_notes?: string | null
          hook?: string
          id?: string
          mp4_urls?: string[]
          png_urls?: string[]
          post_date?: string
          posted_at?: string | null
          posted_url?: string | null
          preview_urls?: string[]
          quality_score?: number | null
          ready_at?: string | null
          seo_description?: string
          slide_json?: Json
          source_article_ids?: string[]
          status?: string
          suggested_publish_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      stats_clutch: {
        Row: {
          clutch_score: number
          computed_at: string
          goals: number
          id: string
          leading_goals: number
          level_goals: number
          player_id: number
          season_id: number
          sport: string
          trailing_goals: number
        }
        Insert: {
          clutch_score?: number
          computed_at?: string
          goals?: number
          id?: string
          leading_goals?: number
          level_goals?: number
          player_id: number
          season_id: number
          sport: string
          trailing_goals?: number
        }
        Update: {
          clutch_score?: number
          computed_at?: string
          goals?: number
          id?: string
          leading_goals?: number
          level_goals?: number
          player_id?: number
          season_id?: number
          sport?: string
          trailing_goals?: number
        }
        Relationships: []
      }
      stats_finishing_index: {
        Row: {
          computed_at: string
          goals: number
          goals_p90: number | null
          id: string
          overperf: number | null
          overperf_percentile: number | null
          player_id: number
          ratio: number | null
          regression_warning: boolean
          season_id: number
          sport: string
          xg: number | null
          xg_p90: number | null
        }
        Insert: {
          computed_at?: string
          goals?: number
          goals_p90?: number | null
          id?: string
          overperf?: number | null
          overperf_percentile?: number | null
          player_id: number
          ratio?: number | null
          regression_warning?: boolean
          season_id: number
          sport: string
          xg?: number | null
          xg_p90?: number | null
        }
        Update: {
          computed_at?: string
          goals?: number
          goals_p90?: number | null
          id?: string
          overperf?: number | null
          overperf_percentile?: number | null
          player_id?: number
          ratio?: number | null
          regression_warning?: boolean
          season_id?: number
          sport?: string
          xg?: number | null
          xg_p90?: number | null
        }
        Relationships: []
      }
      stats_player_twins: {
        Row: {
          computed_at: string
          id: string
          player_id: number
          rank: number
          season_id: number
          similarity: number
          sport: string
          twin_player_id: number
        }
        Insert: {
          computed_at?: string
          id?: string
          player_id: number
          rank: number
          season_id: number
          similarity: number
          sport: string
          twin_player_id: number
        }
        Update: {
          computed_at?: string
          id?: string
          player_id?: number
          rank?: number
          season_id?: number
          similarity?: number
          sport?: string
          twin_player_id?: number
        }
        Relationships: []
      }
      stats_schedule_form: {
        Row: {
          actual_points: number
          computed_at: string
          id: string
          luck: number | null
          season_id: number
          sos: number | null
          sport: string
          sportmonks_xpts: number | null
          team_id: number
          xpts: number | null
        }
        Insert: {
          actual_points?: number
          computed_at?: string
          id?: string
          luck?: number | null
          season_id: number
          sos?: number | null
          sport: string
          sportmonks_xpts?: number | null
          team_id: number
          xpts?: number | null
        }
        Update: {
          actual_points?: number
          computed_at?: string
          id?: string
          luck?: number | null
          season_id?: number
          sos?: number | null
          sport?: string
          sportmonks_xpts?: number | null
          team_id?: number
          xpts?: number | null
        }
        Relationships: []
      }
      stats_season_projection: {
        Row: {
          computed_at: string
          current_points: number
          elo: number
          id: string
          n_sims: number
          p_champion: number
          p_playoff: number
          p_relegation: number
          p_top3: number
          season_id: number
          sport: string
          team_id: number
        }
        Insert: {
          computed_at?: string
          current_points?: number
          elo?: number
          id?: string
          n_sims?: number
          p_champion?: number
          p_playoff?: number
          p_relegation?: number
          p_top3?: number
          season_id: number
          sport: string
          team_id: number
        }
        Update: {
          computed_at?: string
          current_points?: number
          elo?: number
          id?: string
          n_sims?: number
          p_champion?: number
          p_playoff?: number
          p_relegation?: number
          p_top3?: number
          season_id?: number
          sport?: string
          team_id?: number
        }
        Relationships: []
      }
      stats_team_goal_timing: {
        Row: {
          computed_at: string
          goal_count: number
          id: string
          minute_block: string
          season_id: number
          sport: string
          team_id: number
        }
        Insert: {
          computed_at?: string
          goal_count?: number
          id?: string
          minute_block: string
          season_id: number
          sport: string
          team_id: number
        }
        Update: {
          computed_at?: string
          goal_count?: number
          id?: string
          minute_block?: string
          season_id?: number
          sport?: string
          team_id?: number
        }
        Relationships: []
      }
      story_clusters: {
        Row: {
          first_seen_at: string | null
          headline: string | null
          id: string
          item_count: number | null
          last_updated_at: string | null
          signal_score: number | null
          sport: string
          status: string | null
        }
        Insert: {
          first_seen_at?: string | null
          headline?: string | null
          id?: string
          item_count?: number | null
          last_updated_at?: string | null
          signal_score?: number | null
          sport: string
          status?: string | null
        }
        Update: {
          first_seen_at?: string | null
          headline?: string | null
          id?: string
          item_count?: number | null
          last_updated_at?: string | null
          signal_score?: number | null
          sport?: string
          status?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          description: string | null
          id: string
          key: string
          last_modified_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          last_modified_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          last_modified_at?: string
          value?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          agent_from: string | null
          agent_to: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          max_retries: number
          payload: Json
          priority: string
          result: Json | null
          retry_count: number
          scheduled_for: string | null
          started_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_from?: string | null
          agent_to?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          priority?: string
          result?: Json | null
          retry_count?: number
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_from?: string | null
          agent_to?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          priority?: string
          result?: Json | null
          retry_count?: number
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_daily_pulses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          confidence: number
          created_at: string
          dek: string
          editorial_note: string | null
          evidence: Json
          expires_at: string | null
          generated_at: string
          generated_by: string
          headline: string
          hidden_at: string | null
          id: string
          match_context_label: string
          metric_snapshot: Json
          published_at: string | null
          pulse_date: string
          pulse_key: string
          source_article_ids: string[]
          source_fixture_ids: number[]
          sport: string
          status: string
          team_entity_id: string
          tone: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          confidence: number
          created_at?: string
          dek: string
          editorial_note?: string | null
          evidence?: Json
          expires_at?: string | null
          generated_at?: string
          generated_by?: string
          headline: string
          hidden_at?: string | null
          id?: string
          match_context_label?: string
          metric_snapshot?: Json
          published_at?: string | null
          pulse_date: string
          pulse_key: string
          source_article_ids?: string[]
          source_fixture_ids?: number[]
          sport?: string
          status?: string
          team_entity_id: string
          tone?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          confidence?: number
          created_at?: string
          dek?: string
          editorial_note?: string | null
          evidence?: Json
          expires_at?: string | null
          generated_at?: string
          generated_by?: string
          headline?: string
          hidden_at?: string | null
          id?: string
          match_context_label?: string
          metric_snapshot?: Json
          published_at?: string | null
          pulse_date?: string
          pulse_key?: string
          source_article_ids?: string[]
          source_fixture_ids?: number[]
          sport?: string
          status?: string
          team_entity_id?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_daily_pulses_team_entity_id_fkey"
            columns: ["team_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      team_match_stats: {
        Row: {
          accurate_passes: number | null
          corners: number | null
          fixture_id: number
          formation: string | null
          fouls: number | null
          offsides: number | null
          passes: number | null
          possession: number | null
          ppda: number | null
          pressure: number | null
          shots: number | null
          shots_on_target: number | null
          team_id: number
          xg: number | null
          xga: number | null
        }
        Insert: {
          accurate_passes?: number | null
          corners?: number | null
          fixture_id: number
          formation?: string | null
          fouls?: number | null
          offsides?: number | null
          passes?: number | null
          possession?: number | null
          ppda?: number | null
          pressure?: number | null
          shots?: number | null
          shots_on_target?: number | null
          team_id: number
          xg?: number | null
          xga?: number | null
        }
        Update: {
          accurate_passes?: number | null
          corners?: number | null
          fixture_id?: number
          formation?: string | null
          fouls?: number | null
          offsides?: number | null
          passes?: number | null
          possession?: number | null
          ppda?: number | null
          pressure?: number | null
          shots?: number | null
          shots_on_target?: number | null
          team_id?: number
          xg?: number | null
          xga?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_match_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      team_season_stats: {
        Row: {
          clean_sheets: number
          computed_at: string
          draws: number
          form: string | null
          goals_against: number
          goals_for: number
          losses: number
          played: number
          points: number
          season_id: number
          team_id: number
          wins: number
          xg_against: number | null
          xg_for: number | null
        }
        Insert: {
          clean_sheets?: number
          computed_at?: string
          draws?: number
          form?: string | null
          goals_against?: number
          goals_for?: number
          losses?: number
          played?: number
          points?: number
          season_id: number
          team_id: number
          wins?: number
          xg_against?: number | null
          xg_for?: number | null
        }
        Update: {
          clean_sheets?: number
          computed_at?: string
          draws?: number
          form?: string | null
          goals_against?: number
          goals_for?: number
          losses?: number
          played?: number
          points?: number
          season_id?: number
          team_id?: number
          wins?: number
          xg_against?: number | null
          xg_for?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["sportmonks_id"]
          },
          {
            foreignKeyName: "team_season_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      teams: {
        Row: {
          coach_id: number | null
          country: string | null
          founded: number | null
          logo: string | null
          name: string
          short_code: string | null
          sport: string
          sportmonks_id: number
          updated_at: string
          venue_id: number | null
        }
        Insert: {
          coach_id?: number | null
          country?: string | null
          founded?: number | null
          logo?: string | null
          name: string
          short_code?: string | null
          sport?: string
          sportmonks_id: number
          updated_at?: string
          venue_id?: number | null
        }
        Update: {
          coach_id?: number | null
          country?: string | null
          founded?: number | null
          logo?: string | null
          name?: string
          short_code?: string | null
          sport?: string
          sportmonks_id?: number
          updated_at?: string
          venue_id?: number | null
        }
        Relationships: []
      }
      threads: {
        Row: {
          body: string
          clerk_user_id: string
          created_at: string
          fixture_id: string | null
          id: string
          is_match_thread: boolean
          is_pinned: boolean
          last_activity_at: string
          team_slug: string
          title: string
        }
        Insert: {
          body: string
          clerk_user_id: string
          created_at?: string
          fixture_id?: string | null
          id?: string
          is_match_thread?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          team_slug: string
          title: string
        }
        Update: {
          body?: string
          clerk_user_id?: string
          created_at?: string
          fixture_id?: string | null
          id?: string
          is_match_thread?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          team_slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_name: string
          badge_slug: string
          clerk_user_id: string
          earned_at: string | null
          id: string
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          badge_slug: string
          clerk_user_id: string
          earned_at?: string | null
          id?: string
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          badge_slug?: string
          clerk_user_id?: string
          earned_at?: string | null
          id?: string
        }
        Relationships: []
      }
      user_feed_config: {
        Row: {
          clerk_user_id: string
          content_types: string[] | null
          created_at: string | null
          followed_leagues: string[] | null
          followed_team_ids: string[] | null
          id: string
          importance_tier_min: string | null
          injury_severity_filter: string[] | null
          sport: string
          transfer_confidence_min: number | null
          updated_at: string | null
          xg_only: boolean | null
        }
        Insert: {
          clerk_user_id: string
          content_types?: string[] | null
          created_at?: string | null
          followed_leagues?: string[] | null
          followed_team_ids?: string[] | null
          id?: string
          importance_tier_min?: string | null
          injury_severity_filter?: string[] | null
          sport?: string
          transfer_confidence_min?: number | null
          updated_at?: string | null
          xg_only?: boolean | null
        }
        Update: {
          clerk_user_id?: string
          content_types?: string[] | null
          created_at?: string | null
          followed_leagues?: string[] | null
          followed_team_ids?: string[] | null
          id?: string
          importance_tier_min?: string | null
          injury_severity_filter?: string[] | null
          sport?: string
          transfer_confidence_min?: number | null
          updated_at?: string | null
          xg_only?: boolean | null
        }
        Relationships: []
      }
      user_feed_usage: {
        Row: {
          clerk_user_id: string
          date: string
          items_seen: number | null
        }
        Insert: {
          clerk_user_id: string
          date?: string
          items_seen?: number | null
        }
        Update: {
          clerk_user_id?: string
          date?: string
          items_seen?: number | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          sport: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          sport?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          sport?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_football_iq: {
        Row: {
          articles_read: number
          articles_read_fully: number
          clerk_user_id: string
          id: string
          iq_score: number
          league_rank: number | null
          matches_covered: number
          predictions_correct: number
          predictions_made: number
          updated_at: string | null
          weekly_iq: number
          weekly_rank: number | null
        }
        Insert: {
          articles_read?: number
          articles_read_fully?: number
          clerk_user_id: string
          id?: string
          iq_score?: number
          league_rank?: number | null
          matches_covered?: number
          predictions_correct?: number
          predictions_made?: number
          updated_at?: string | null
          weekly_iq?: number
          weekly_rank?: number | null
        }
        Update: {
          articles_read?: number
          articles_read_fully?: number
          clerk_user_id?: string
          id?: string
          iq_score?: number
          league_rank?: number | null
          matches_covered?: number
          predictions_correct?: number
          predictions_made?: number
          updated_at?: string | null
          weekly_iq?: number
          weekly_rank?: number | null
        }
        Relationships: []
      }
      user_league_memberships: {
        Row: {
          clerk_user_id: string
          id: string
          joined_at: string | null
          league_id: string
        }
        Insert: {
          clerk_user_id: string
          id?: string
          joined_at?: string | null
          league_id: string
        }
        Update: {
          clerk_user_id?: string
          id?: string
          joined_at?: string | null
          league_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_league_memberships_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "fan_leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_season_streak: {
        Row: {
          clerk_user_id: string
          current_streak: number
          freeze_tokens: number
          freeze_used_rounds: number[] | null
          id: string
          last_completed_round: number | null
          longest_streak: number
          season: number
          updated_at: string | null
        }
        Insert: {
          clerk_user_id: string
          current_streak?: number
          freeze_tokens?: number
          freeze_used_rounds?: number[] | null
          id?: string
          last_completed_round?: number | null
          longest_streak?: number
          season?: number
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string
          current_streak?: number
          freeze_tokens?: number
          freeze_used_rounds?: number[] | null
          id?: string
          last_completed_round?: number | null
          longest_streak?: number
          season?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          capacity: number | null
          city: string | null
          name: string | null
          sportmonks_id: number
          surface: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          name?: string | null
          sportmonks_id: number
          surface?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          name?: string | null
          sportmonks_id?: number
          surface?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          favorite_team: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          favorite_team?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          favorite_team?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      news_feed: {
        Row: {
          created_at: string | null
          duplicate_sources: string[] | null
          entity_ids: string[] | null
          event_type: string | null
          feed_reasons: string[] | null
          feed_score: number | null
          id: string | null
          importance_score: number | null
          news_tag: string | null
          published_at: string | null
          push_priority: string | null
          sentiment: string | null
          source_count: number | null
          source_name: string | null
          sport: string | null
          story_cluster_id: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          duplicate_sources?: string[] | null
          entity_ids?: string[] | null
          event_type?: string | null
          feed_reasons?: string[] | null
          feed_score?: number | null
          id?: string | null
          importance_score?: number | null
          news_tag?: string | null
          published_at?: string | null
          push_priority?: string | null
          sentiment?: string | null
          source_count?: number | null
          source_name?: string | null
          sport?: string | null
          story_cluster_id?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          duplicate_sources?: string[] | null
          entity_ids?: string[] | null
          event_type?: string | null
          feed_reasons?: string[] | null
          feed_score?: number | null
          id?: string | null
          importance_score?: number | null
          news_tag?: string | null
          published_at?: string | null
          push_priority?: string | null
          sentiment?: string | null
          source_count?: number | null
          source_name?: string | null
          sport?: string | null
          story_cluster_id?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      player_season_stats_agg: {
        Row: {
          appearances: number | null
          assists: number | null
          clearances: number | null
          computed_at: string | null
          dribbles: number | null
          fouls: number | null
          goals: number | null
          interceptions: number | null
          key_passes: number | null
          minutes: number | null
          pass_accuracy: number | null
          passes: number | null
          player_id: number | null
          rating: number | null
          red_cards: number | null
          season_id: number | null
          shots: number | null
          shots_on_target: number | null
          tackles: number | null
          team_id: number | null
          xa: number | null
          xg: number | null
          yellow_cards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["sportmonks_id"]
          },
        ]
      }
      published_entity_insights: {
        Row: {
          body: string | null
          confidence: number | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_slug: string | null
          entity_type: string | null
          evidence: Json | null
          expires_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string | null
          insight_key: string | null
          insight_type: string | null
          metric_snapshot: Json | null
          severity: string | null
          source_article_ids: string[] | null
          source_fixture_ids: number[] | null
          sport: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          window_end: string | null
          window_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_insights_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      published_team_daily_pulses: {
        Row: {
          body: string | null
          created_at: string | null
          dek: string | null
          editorial_note: string | null
          evidence: Json | null
          expires_at: string | null
          generated_at: string | null
          generated_by: string | null
          headline: string | null
          id: string | null
          match_context_label: string | null
          metric_snapshot: Json | null
          published_at: string | null
          pulse_date: string | null
          pulse_key: string | null
          source_article_ids: string[] | null
          source_fixture_ids: number[] | null
          sport: string | null
          team_entity_id: string | null
          team_name: string | null
          team_slug: string | null
          tone: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_daily_pulses_team_entity_id_fkey"
            columns: ["team_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_fixtures_latest: {
        Row: {
          fetched_at: string | null
          json_data: Json | null
          sportmonks_id: number | null
        }
        Relationships: []
      }
      raw_players_latest: {
        Row: {
          fetched_at: string | null
          json_data: Json | null
          sportmonks_id: number | null
        }
        Relationships: []
      }
      raw_squads_latest: {
        Row: {
          fetched_at: string | null
          json_data: Json | null
          sportmonks_id: number | null
        }
        Relationships: []
      }
      raw_teams_latest: {
        Row: {
          fetched_at: string | null
          json_data: Json | null
          sportmonks_id: number | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          health: string | null
          hours_stale: number | null
          last_activity: string | null
          rows: number | null
          subsystem: string | null
        }
        Relationships: []
      }
      team_push_popups: {
        Row: {
          article_id: string | null
          body: string | null
          created_at: string | null
          event_type: string | null
          feed_score: number | null
          id: string | null
          importance_score: number | null
          metadata: Json | null
          news_tag: string | null
          source_name: string | null
          sport: string | null
          status: string | null
          story_key: string | null
          team_entity_id: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          article_id?: string | null
          body?: string | null
          created_at?: string | null
          event_type?: string | null
          feed_score?: number | null
          id?: string | null
          importance_score?: number | null
          metadata?: Json | null
          news_tag?: string | null
          source_name?: string | null
          sport?: string | null
          status?: string | null
          story_key?: string | null
          team_entity_id?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          article_id?: string | null
          body?: string | null
          created_at?: string | null
          event_type?: string | null
          feed_score?: number | null
          id?: string | null
          importance_score?: number | null
          metadata?: Json | null
          news_tag?: string | null
          source_name?: string | null
          sport?: string | null
          status?: string | null
          story_key?: string | null
          team_entity_id?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_candidates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_candidates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_candidates_team_entity_id_fkey"
            columns: ["team_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      append_duplicate_source: {
        Args: { article_id: string; source: string }
        Returns: undefined
      }
      bump_chat_usage: {
        Args: { p_tokens_in: number; p_tokens_out: number; p_user_id: string }
        Returns: number
      }
      bump_data_version: { Args: { p_sport: string }; Returns: undefined }
      cleanup_expired_agent_memory: { Args: never; Returns: number }
      cleanup_old_data: { Args: never; Returns: undefined }
      get_pending_tasks: {
        Args: { p_agent_to: string; p_limit?: number }
        Returns: {
          agent_from: string | null
          agent_to: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          max_retries: number
          payload: Json
          priority: string
          result: Json | null
          retry_count: number
          scheduled_for: string | null
          started_at: string | null
          status: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_team_top_scorers: {
        Args: {
          p_limit?: number
          p_season_id?: number
          p_sportsmonks_team_id: number
        }
        Returns: {
          matches_played: number
          player_name: string
          sportsmonks_player_id: number
          total_assists: number
          total_goals: number
        }[]
      }
      increment_feed_usage: {
        Args: { p_clerk_user_id: string; p_date: string }
        Returns: undefined
      }
      increment_reply_count: { Args: { row_id: string }; Returns: undefined }
      match_articles: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk: string
          content_id: string
          similarity: number
        }[]
      }
      match_embeddings: {
        Args: {
          filter_content_type?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          content_id: string
          similarity: number
        }[]
      }
      rollup_team_season_xg: { Args: never; Returns: number }
      search_memories: {
        Args: { match_count?: number; query_text: string }
        Returns: {
          agent_id: string
          content: string
          created_at: string
          id: string
          importance_score: number
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_like: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_repost: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: boolean
      }
      update_league_ranks: { Args: { user_ranks: Json }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
