--
-- PostgreSQL database dump
--

\restrict LSgEu9eO8kX6uibyTurPrgDG1HyFHwm9A2QseMNrIZpzaAFBTSqA6hOPhzzZO2Q

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: evolution_api; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA evolution_api;


ALTER SCHEMA evolution_api OWNER TO postgres;

--
-- Name: DeviceMessage; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."DeviceMessage" AS ENUM (
    'ios',
    'android',
    'web',
    'unknown',
    'desktop'
);


ALTER TYPE evolution_api."DeviceMessage" OWNER TO postgres;

--
-- Name: DifyBotType; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."DifyBotType" AS ENUM (
    'chatBot',
    'textGenerator',
    'agent',
    'workflow'
);


ALTER TYPE evolution_api."DifyBotType" OWNER TO postgres;

--
-- Name: InstanceConnectionStatus; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."InstanceConnectionStatus" AS ENUM (
    'open',
    'close',
    'connecting'
);


ALTER TYPE evolution_api."InstanceConnectionStatus" OWNER TO postgres;

--
-- Name: OpenaiBotType; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."OpenaiBotType" AS ENUM (
    'assistant',
    'chatCompletion'
);


ALTER TYPE evolution_api."OpenaiBotType" OWNER TO postgres;

--
-- Name: SessionStatus; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."SessionStatus" AS ENUM (
    'opened',
    'closed',
    'paused'
);


ALTER TYPE evolution_api."SessionStatus" OWNER TO postgres;

--
-- Name: TriggerOperator; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."TriggerOperator" AS ENUM (
    'contains',
    'equals',
    'startsWith',
    'endsWith',
    'regex'
);


ALTER TYPE evolution_api."TriggerOperator" OWNER TO postgres;

--
-- Name: TriggerType; Type: TYPE; Schema: evolution_api; Owner: postgres
--

CREATE TYPE evolution_api."TriggerType" AS ENUM (
    'all',
    'keyword',
    'none',
    'advanced'
);


ALTER TYPE evolution_api."TriggerType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Chat; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Chat" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    labels jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" text NOT NULL,
    name character varying(100),
    "unreadMessages" integer DEFAULT 0 NOT NULL
);


ALTER TABLE evolution_api."Chat" OWNER TO postgres;

--
-- Name: Chatwoot; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Chatwoot" (
    id text NOT NULL,
    enabled boolean DEFAULT true,
    "accountId" character varying(100),
    token character varying(100),
    url character varying(500),
    "nameInbox" character varying(100),
    "signMsg" boolean DEFAULT false,
    "signDelimiter" character varying(100),
    number character varying(100),
    "reopenConversation" boolean DEFAULT false,
    "conversationPending" boolean DEFAULT false,
    "mergeBrazilContacts" boolean DEFAULT false,
    "importContacts" boolean DEFAULT false,
    "importMessages" boolean DEFAULT false,
    "daysLimitImportMessages" integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    logo character varying(500),
    organization character varying(100),
    "ignoreJids" jsonb
);


ALTER TABLE evolution_api."Chatwoot" OWNER TO postgres;

--
-- Name: Contact; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Contact" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" character varying(100),
    "profilePicUrl" character varying(500),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Contact" OWNER TO postgres;

--
-- Name: Dify; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Dify" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "botType" evolution_api."DifyBotType" NOT NULL,
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution_api."TriggerType",
    "triggerOperator" evolution_api."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    description character varying(255),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."Dify" OWNER TO postgres;

--
-- Name: DifySetting; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."DifySetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "difyIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."DifySetting" OWNER TO postgres;

--
-- Name: EvolutionBot; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."EvolutionBot" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution_api."TriggerType",
    "triggerOperator" evolution_api."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."EvolutionBot" OWNER TO postgres;

--
-- Name: EvolutionBotSetting; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."EvolutionBotSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "botIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."EvolutionBotSetting" OWNER TO postgres;

--
-- Name: Flowise; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Flowise" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution_api."TriggerType",
    "triggerOperator" evolution_api."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."Flowise" OWNER TO postgres;

--
-- Name: FlowiseSetting; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."FlowiseSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "flowiseIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."FlowiseSetting" OWNER TO postgres;

--
-- Name: Instance; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Instance" (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    "connectionStatus" evolution_api."InstanceConnectionStatus" DEFAULT 'open'::evolution_api."InstanceConnectionStatus" NOT NULL,
    "ownerJid" character varying(100),
    "profilePicUrl" character varying(500),
    integration character varying(100),
    number character varying(100),
    token character varying(255),
    "clientName" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "profileName" character varying(100),
    "businessId" character varying(100),
    "disconnectionAt" timestamp without time zone,
    "disconnectionObject" jsonb,
    "disconnectionReasonCode" integer
);


ALTER TABLE evolution_api."Instance" OWNER TO postgres;

--
-- Name: IntegrationSession; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."IntegrationSession" (
    id text NOT NULL,
    "sessionId" character varying(255) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" text,
    status evolution_api."SessionStatus" NOT NULL,
    "awaitUser" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    parameters jsonb,
    context jsonb,
    "botId" text,
    type character varying(100)
);


ALTER TABLE evolution_api."IntegrationSession" OWNER TO postgres;

--
-- Name: IsOnWhatsapp; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."IsOnWhatsapp" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "jidOptions" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE evolution_api."IsOnWhatsapp" OWNER TO postgres;

--
-- Name: Label; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Label" (
    id text NOT NULL,
    "labelId" character varying(100),
    name character varying(100) NOT NULL,
    color character varying(100) NOT NULL,
    "predefinedId" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Label" OWNER TO postgres;

--
-- Name: Media; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Media" (
    id text NOT NULL,
    "fileName" character varying(500) NOT NULL,
    type character varying(100) NOT NULL,
    mimetype character varying(100) NOT NULL,
    "createdAt" date DEFAULT CURRENT_TIMESTAMP,
    "messageId" text NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Media" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Message" (
    id text NOT NULL,
    key jsonb NOT NULL,
    "pushName" character varying(100),
    participant character varying(100),
    "messageType" character varying(100) NOT NULL,
    message jsonb NOT NULL,
    "contextInfo" jsonb,
    source evolution_api."DeviceMessage" NOT NULL,
    "messageTimestamp" integer NOT NULL,
    "chatwootMessageId" integer,
    "chatwootInboxId" integer,
    "chatwootConversationId" integer,
    "chatwootContactInboxSourceId" character varying(100),
    "chatwootIsRead" boolean,
    "instanceId" text NOT NULL,
    "webhookUrl" character varying(500),
    "sessionId" text,
    status character varying(30)
);


ALTER TABLE evolution_api."Message" OWNER TO postgres;

--
-- Name: MessageUpdate; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."MessageUpdate" (
    id text NOT NULL,
    "keyId" character varying(100) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "fromMe" boolean NOT NULL,
    participant character varying(100),
    "pollUpdates" jsonb,
    status character varying(30) NOT NULL,
    "messageId" text NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."MessageUpdate" OWNER TO postgres;

--
-- Name: OpenaiBot; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."OpenaiBot" (
    id text NOT NULL,
    "assistantId" character varying(255),
    model character varying(100),
    "systemMessages" jsonb,
    "assistantMessages" jsonb,
    "userMessages" jsonb,
    "maxTokens" integer,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution_api."TriggerType",
    "triggerOperator" evolution_api."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" text NOT NULL,
    "instanceId" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "botType" evolution_api."OpenaiBotType" NOT NULL,
    description character varying(255),
    "functionUrl" character varying(500),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."OpenaiBot" OWNER TO postgres;

--
-- Name: OpenaiCreds; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."OpenaiCreds" (
    id text NOT NULL,
    "apiKey" character varying(255),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    name character varying(255)
);


ALTER TABLE evolution_api."OpenaiCreds" OWNER TO postgres;

--
-- Name: OpenaiSetting; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."OpenaiSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" text NOT NULL,
    "openaiIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "speechToText" boolean DEFAULT false,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution_api."OpenaiSetting" OWNER TO postgres;

--
-- Name: Proxy; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Proxy" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    host character varying(100) NOT NULL,
    port character varying(100) NOT NULL,
    protocol character varying(100) NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Proxy" OWNER TO postgres;

--
-- Name: Pusher; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Pusher" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "appId" character varying(100) NOT NULL,
    key character varying(100) NOT NULL,
    secret character varying(100) NOT NULL,
    cluster character varying(100) NOT NULL,
    "useTLS" boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Pusher" OWNER TO postgres;

--
-- Name: Rabbitmq; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Rabbitmq" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Rabbitmq" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Session" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    creds text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE evolution_api."Session" OWNER TO postgres;

--
-- Name: Setting; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Setting" (
    id text NOT NULL,
    "rejectCall" boolean DEFAULT false NOT NULL,
    "msgCall" character varying(100),
    "groupsIgnore" boolean DEFAULT false NOT NULL,
    "alwaysOnline" boolean DEFAULT false NOT NULL,
    "readMessages" boolean DEFAULT false NOT NULL,
    "readStatus" boolean DEFAULT false NOT NULL,
    "syncFullHistory" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "wavoipToken" character varying(100)
);


ALTER TABLE evolution_api."Setting" OWNER TO postgres;

--
-- Name: Sqs; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Sqs" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Sqs" OWNER TO postgres;

--
-- Name: Template; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Template" (
    id text NOT NULL,
    "templateId" character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    template jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "webhookUrl" character varying(500)
);


ALTER TABLE evolution_api."Template" OWNER TO postgres;

--
-- Name: Typebot; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Typebot" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    url character varying(500) NOT NULL,
    typebot character varying(100) NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "triggerType" evolution_api."TriggerType",
    "triggerOperator" evolution_api."TriggerOperator",
    "triggerValue" text,
    "instanceId" text NOT NULL,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    description character varying(255)
);


ALTER TABLE evolution_api."Typebot" OWNER TO postgres;

--
-- Name: TypebotSetting; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."TypebotSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "debounceTime" integer,
    "typebotIdFallback" character varying(100),
    "ignoreJids" jsonb
);


ALTER TABLE evolution_api."TypebotSetting" OWNER TO postgres;

--
-- Name: Webhook; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Webhook" (
    id text NOT NULL,
    url character varying(500) NOT NULL,
    enabled boolean DEFAULT true,
    events jsonb,
    "webhookByEvents" boolean DEFAULT false,
    "webhookBase64" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    headers jsonb
);


ALTER TABLE evolution_api."Webhook" OWNER TO postgres;

--
-- Name: Websocket; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api."Websocket" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution_api."Websocket" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: evolution_api; Owner: postgres
--

CREATE TABLE evolution_api._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE evolution_api._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Chat; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Chat" (id, "remoteJid", labels, "createdAt", "updatedAt", "instanceId", name, "unreadMessages") FROM stdin;
\.


--
-- Data for Name: Chatwoot; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Chatwoot" (id, enabled, "accountId", token, url, "nameInbox", "signMsg", "signDelimiter", number, "reopenConversation", "conversationPending", "mergeBrazilContacts", "importContacts", "importMessages", "daysLimitImportMessages", "createdAt", "updatedAt", "instanceId", logo, organization, "ignoreJids") FROM stdin;
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Contact" (id, "remoteJid", "pushName", "profilePicUrl", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Dify; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Dify" (id, enabled, "botType", "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", description, "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: DifySetting; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."DifySetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "difyIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: EvolutionBot; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."EvolutionBot" (id, enabled, description, "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: EvolutionBotSetting; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."EvolutionBotSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "botIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Flowise; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Flowise" (id, enabled, description, "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: FlowiseSetting; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."FlowiseSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "flowiseIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Instance; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Instance" (id, name, "connectionStatus", "ownerJid", "profilePicUrl", integration, number, token, "clientName", "createdAt", "updatedAt", "profileName", "businessId", "disconnectionAt", "disconnectionObject", "disconnectionReasonCode") FROM stdin;
886f6563-37c6-49a5-8d40-936deea4e347	Instancia-conserto-celular	close	\N	\N	WHATSAPP-BAILEYS	21984870401	47A28515-9676-431F-BF1A-736E4A212162	loja_celulares_evolution	2026-04-10 04:23:39.999	2026-04-10 04:23:39.999	\N	\N	\N	\N	\N
\.


--
-- Data for Name: IntegrationSession; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."IntegrationSession" (id, "sessionId", "remoteJid", "pushName", status, "awaitUser", "createdAt", "updatedAt", "instanceId", parameters, context, "botId", type) FROM stdin;
\.


--
-- Data for Name: IsOnWhatsapp; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."IsOnWhatsapp" (id, "remoteJid", "jidOptions", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Label; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Label" (id, "labelId", name, color, "predefinedId", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Media" (id, "fileName", type, mimetype, "createdAt", "messageId", "instanceId") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Message" (id, key, "pushName", participant, "messageType", message, "contextInfo", source, "messageTimestamp", "chatwootMessageId", "chatwootInboxId", "chatwootConversationId", "chatwootContactInboxSourceId", "chatwootIsRead", "instanceId", "webhookUrl", "sessionId", status) FROM stdin;
\.


--
-- Data for Name: MessageUpdate; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."MessageUpdate" (id, "keyId", "remoteJid", "fromMe", participant, "pollUpdates", status, "messageId", "instanceId") FROM stdin;
\.


--
-- Data for Name: OpenaiBot; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."OpenaiBot" (id, "assistantId", model, "systemMessages", "assistantMessages", "userMessages", "maxTokens", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "openaiCredsId", "instanceId", enabled, "botType", description, "functionUrl", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: OpenaiCreds; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."OpenaiCreds" (id, "apiKey", "createdAt", "updatedAt", "instanceId", name) FROM stdin;
\.


--
-- Data for Name: OpenaiSetting; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."OpenaiSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "openaiCredsId", "openaiIdFallback", "instanceId", "speechToText", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Proxy; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Proxy" (id, enabled, host, port, protocol, username, password, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Pusher; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Pusher" (id, enabled, "appId", key, secret, cluster, "useTLS", events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Rabbitmq; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Rabbitmq" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Session" (id, "sessionId", creds, "createdAt") FROM stdin;
cmnsei6uh0003pe5wca7gucxb	886f6563-37c6-49a5-8d40-936deea4e347	"{\\"noiseKey\\":{\\"private\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"8GeeTIhZOwxSuW9fbFFx/5wqqTFNZck7ksdXy/rY5F8=\\"},\\"public\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"fCjNY38ZUWdKHBrY2IcoECXXwgcLneVxinIZ4ujS4EY=\\"}},\\"pairingEphemeralKeyPair\\":{\\"private\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"AFT1ZfuKl+76oR5n5LNaQAGdrKsU2lyF5iJ1xkabf30=\\"},\\"public\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"EdwbGo5wgyP/06KwcU33eMeZVL7u0lC20tmdlDfH/gw=\\"}},\\"signedIdentityKey\\":{\\"private\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"4AgeW0yhLmXDzziSnVMNeJZQtPdTY1ldYuLKrY6eAXw=\\"},\\"public\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"CFdw1K2vUz2Bq9Junphh6OxzcvrDQ5qLLlcQlWq5v1E=\\"}},\\"signedPreKey\\":{\\"keyPair\\":{\\"private\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"GCgjYwKYqnR5+KjzGyQM3/giluyT3cLJxYAvInTwqWg=\\"},\\"public\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"DBwQ75XD8xSb+jfX+cAs9UfIey/glycCsOMDdRilHyw=\\"}},\\"signature\\":{\\"type\\":\\"Buffer\\",\\"data\\":\\"4Pqq7yIIY/zuwWEFf6vCbIhcUulwHHzrfoEkSdTidZtQajIvqq53k5rVqQqqlsWXdi1eeM4fvA2itPDoNzt3DQ==\\"},\\"keyId\\":1},\\"registrationId\\":121,\\"advSecretKey\\":\\"nEaK/g0bG4NnW6cF+ZcodekvYxJCNhER5R2/Tju0UPU=\\",\\"processedHistoryMessages\\":[],\\"nextPreKeyId\\":1,\\"firstUnuploadedPreKeyId\\":1,\\"accountSyncCounter\\":0,\\"accountSettings\\":{\\"unarchiveChats\\":false},\\"registered\\":false}"	2026-04-10 04:23:40.073
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Setting" (id, "rejectCall", "msgCall", "groupsIgnore", "alwaysOnline", "readMessages", "readStatus", "syncFullHistory", "createdAt", "updatedAt", "instanceId", "wavoipToken") FROM stdin;
cmnsei6so0001pe5wf1ze4qd0	f		f	f	f	f	f	2026-04-10 04:23:40.008	2026-04-10 04:23:40.008	886f6563-37c6-49a5-8d40-936deea4e347	
\.


--
-- Data for Name: Sqs; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Sqs" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Template; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Template" (id, "templateId", name, template, "createdAt", "updatedAt", "instanceId", "webhookUrl") FROM stdin;
\.


--
-- Data for Name: Typebot; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Typebot" (id, enabled, url, typebot, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "createdAt", "updatedAt", "triggerType", "triggerOperator", "triggerValue", "instanceId", "debounceTime", "ignoreJids", description) FROM stdin;
\.


--
-- Data for Name: TypebotSetting; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."TypebotSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "createdAt", "updatedAt", "instanceId", "debounceTime", "typebotIdFallback", "ignoreJids") FROM stdin;
\.


--
-- Data for Name: Webhook; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Webhook" (id, url, enabled, events, "webhookByEvents", "webhookBase64", "createdAt", "updatedAt", "instanceId", headers) FROM stdin;
\.


--
-- Data for Name: Websocket; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api."Websocket" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: evolution_api; Owner: postgres
--

COPY evolution_api._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
176890b8-e617-4f80-9f70-b92aa11923a1	1af30cbbccd90152fbb1b99a458978e42428a792b822b4b5f9c9c7fffbf7264f	2026-04-09 22:23:46.609048+00	20240819154941_add_context_to_integration_session	\N	\N	2026-04-09 22:23:46.598899+00	1
dc9a0d09-1a2a-4779-b030-c72282bc47ef	7507eff6b49fad53cdd0b3ace500f529597dfa1a8987afbb9807968a8ee8ef49	2026-04-09 22:23:45.444231+00	20240609181238_init	\N	\N	2026-04-09 22:23:45.001047+00	1
74dce79e-98fd-4c13-b42c-01ef0785b736	8c2a595975dc2f6dee831983304996e25c37014c48291576e7c8044078bfde32	2026-04-09 22:23:45.938131+00	20240722173259_add_name_column_to_openai_creds	\N	\N	2026-04-09 22:23:45.911916+00	1
d6fc3cb8-950e-4533-8f91-665a3f5781f8	914eeefb9eba0dacdbcb7cdbe47567abd957543d6f27c39db4eec6a40c864008	2026-04-09 22:23:45.46711+00	20240610144159_create_column_profile_name_instance	\N	\N	2026-04-09 22:23:45.447585+00	1
b3be51f7-c13d-4011-af9f-2a0386d8b07a	50d6920345af06dbd5086959784b7e2b4d163a5b555ff1029e5f81678a454444	2026-04-09 22:23:45.482055+00	20240611125754_create_columns_whitelabel_chatwoot	\N	\N	2026-04-09 22:23:45.471228+00	1
e7ad744f-e5d7-4157-abed-b14f2ed6f3c1	c29ccc88930138c50091712466f3f97bff48f6a0f486dcec5b19dc08c3612973	2026-04-09 22:23:46.278615+00	20240729180347_modify_typebot_session_status_openai_typebot_table	\N	\N	2026-04-09 22:23:46.124024+00	1
3002b15c-5817-46be-a6f3-1d58104448cd	b90c49299ed812fb46b71a4f0b9f818b7fc7109c52b1aff227a107236839d93c	2026-04-09 22:23:45.51952+00	20240611202817_create_columns_debounce_time_typebot	\N	\N	2026-04-09 22:23:45.506778+00	1
a9b43af1-2e7d-47cd-b260-43cb9fcfcfba	20b3c04d93799c25fa8b2d0a85d10f9280e915a5d7519542492ed85ff082a3c0	2026-04-09 22:23:45.950987+00	20240722173518_add_name_column_to_openai_creds	\N	\N	2026-04-09 22:23:45.941386+00	1
44d63944-7465-4503-b12f-fd73a361ec2f	01303057a037f5dc28272ac513b60d5a75be71d1bf727e671ca538db3268fa2e	2026-04-09 22:23:45.541619+00	20240712144948_add_business_id_column_to_instances	\N	\N	2026-04-09 22:23:45.522964+00	1
93fbb55d-c2ed-4758-9759-c47dcb3e95c3	34235c250eb1f088c285489ad690b4c045680f1638076436cdc66de0ea382cc2	2026-04-09 22:23:45.597737+00	20240712150256_create_templates_table	\N	\N	2026-04-09 22:23:45.54456+00	1
bf5be098-ae65-438f-8dcf-c13ac91412e3	0ba192ba428c9ab5a9b31d1f7d73603ee47b6192e2f8c590f6d93ade0dbdbccf	2026-04-09 22:23:45.616873+00	20240712155950_adjusts_in_templates_table	\N	\N	2026-04-09 22:23:45.601132+00	1
99d073a8-a417-4127-953f-bc8cb64b9c94	7ffb91b84cb7aa17b1f488d580626144cd557ccdfaec6654515545401d1938af	2026-04-09 22:23:45.980512+00	20240723152648_adjusts_in_column_openai_creds	\N	\N	2026-04-09 22:23:45.95442+00	1
7368e92a-c47b-4379-baad-ba60f4c641cc	426256b73f7ea52538dc91a890179c841325a9c387cf02885b81971d582af830	2026-04-09 22:23:45.645551+00	20240712162206_remove_templates_table	\N	\N	2026-04-09 22:23:45.620022+00	1
8f830318-b95c-49f3-bd20-dae33e3be22a	3496739609829e80daf733baecd3d3e4e279bf318a99adc1ca3aa1c76f893b2f	2026-04-09 22:23:45.663109+00	20240712223655_column_fallback_typebot	\N	\N	2026-04-09 22:23:45.649737+00	1
794397ff-0c64-4602-a7c5-919b2354b5b9	c8627bad5d72ee4ef774ed32c95a2524517b0c60c49fa67cd4ba9dff7cbdde3b	2026-04-09 22:23:46.430073+00	20240811021156_add_chat_name_column	\N	\N	2026-04-09 22:23:46.420247+00	1
728dea15-b476-42cb-9e83-65691b9b41f6	bea48f697c0c5db52ade4a3f26c1321e3f5611c80ea50384baa54e58c6b3a79e	2026-04-09 22:23:45.679607+00	20240712230631_column_ignore_jids_typebot	\N	\N	2026-04-09 22:23:45.666161+00	1
cff6a2b7-9857-40f8-857b-80c7f9de0839	3056f8f1335e8933e4098f005e33cd4821190be2eb76520c0d01e2e13cf6e073	2026-04-09 22:23:46.014324+00	20240723200254_add_webhookurl_on_message	\N	\N	2026-04-09 22:23:45.983399+00	1
33f63bdf-409c-4b87-acb4-88400b0fefa7	1bac56740af5d2d6512b29e7a6e0721d69b2a290400f6660b92b6f2d8b30cd6e	2026-04-09 22:23:45.734006+00	20240713184337_add_media_table	\N	\N	2026-04-09 22:23:45.683283+00	1
eda5abaa-0a63-428b-ab8c-f222e19b296f	bdd992b253321ca9a9556e30fea5e7760556cb8e80140aec34066301b55dc675	2026-04-09 22:23:45.89551+00	20240718121437_add_openai_tables	\N	\N	2026-04-09 22:23:45.766723+00	1
3bb20116-dfc1-4ad4-97d2-d222b5ad9961	961a8627684fe1e4c7123565db3d16db30768df41881342032f9a2df16145eaf	2026-04-09 22:23:46.361276+00	20240730152156_create_dify_tables	\N	\N	2026-04-09 22:23:46.281515+00	1
c777673c-cda5-405b-b806-ddd12587c832	8147ec0cc86ac30ea1be05d461559ba5064273a3fcb3227af71ddcd895f5aebe	2026-04-09 22:23:45.909298+00	20240718123923_adjusts_openai_tables	\N	\N	2026-04-09 22:23:45.898497+00	1
34598836-dced-499b-81bc-de96872b5cfc	9d6c9b4ffe51483a851f6507f7aefd2fb34f54a7c28961856e3230fda4f87022	2026-04-09 22:23:46.06564+00	20240725184147_create_template_table	\N	\N	2026-04-09 22:23:46.017608+00	1
8a1aff85-d3ab-49f6-a9ce-8b5e26c1a650	94e2edb21107895c77b24402f41cd020c7f74dbb39b9a95664a45e62e2582be9	2026-04-09 22:23:46.090822+00	20240725202651_add_webhook_url_template_table	\N	\N	2026-04-09 22:23:46.068756+00	1
c14674c8-e253-494f-9ab5-8bebca433cb4	d0da588e4204c50bde2e41a615b9301afca072991033545b6f4e3e34e088db87	2026-04-09 22:23:46.104081+00	20240725221646_modify_token_instance_table	\N	\N	2026-04-09 22:23:46.093622+00	1
71588a6b-91fa-49f9-8c76-8f96384298f0	b56b053451d564ff6282078fad4fc7bff4aa71e3b0b8d00bf219da4ed1bc4c86	2026-04-09 22:23:46.374902+00	20240801193907_add_column_speech_to_text_openai_setting_table	\N	\N	2026-04-09 22:23:46.36417+00	1
207d6f38-1968-49f1-8ff9-880c581e0736	a80f5c27cd80d088ea69153f8d6f4879406770ffa5a7fd50b28da82bd020322e	2026-04-09 22:23:46.120241+00	20240729115127_modify_trigger_type_openai_typebot_table	\N	\N	2026-04-09 22:23:46.107126+00	1
50f0d044-dc6e-4624-98a6-71baba262219	428a9148f2a29f773e0c9813149e6d07bf51765e018652aeac0be2141a722b67	2026-04-09 22:23:46.524193+00	20240814173033_add_ignore_jids_chatwoot	\N	\N	2026-04-09 22:23:46.492+00	1
3fcfaa90-7df2-4ac6-aed8-85124fff440c	2b963cbc826ea024f9a643af2d5d9fcea06717c90ec9bacb255d3836efa06aea	2026-04-09 22:23:46.388052+00	20240803163908_add_column_description_on_integrations_table	\N	\N	2026-04-09 22:23:46.37798+00	1
34942124-7bc8-443c-bf7c-4e1a2a9f7481	ee44f0420384d55de6d252fffb8f2cfa88479e5811e14cfe975d8edfcc6957e0	2026-04-09 22:23:46.461089+00	20240811183328_add_unique_index_for_remoted_jid_and_instance_in_contacts	\N	\N	2026-04-09 22:23:46.433146+00	1
65b6963a-8f0c-47ca-a4ad-21023981e658	4d2dd947ebb7515c7c278472a10ebab6d5f41a5ef60e15df717a05d457d5d2aa	2026-04-09 22:23:46.416682+00	20240808210239_add_column_function_url_openaibot_table	\N	\N	2026-04-09 22:23:46.391578+00	1
e685d449-a493-4789-a440-4a9fcc22c87d	29c330029a48aaee63567e63c4f4e57b7c1f5344162b11fbf61a4dc194547861	2026-04-09 22:23:46.4811+00	20240813003116_make_label_unique_for_instance	\N	\N	2026-04-09 22:23:46.464323+00	1
7c9e3deb-4743-432c-834b-9c03aab27621	bc5cd1c7fb4df72e88cb4856c9c49ea340284c9d8f389fe558008a921494ed82	2026-04-09 22:23:46.596031+00	20240817110155_add_trigger_type_advanced	\N	\N	2026-04-09 22:23:46.586564+00	1
c41b5877-26d4-4b3a-ae51-077c4dc63ddf	e1eb8997ac99fd555b8a9241c817b97fa5614124922b4e6b3cb1751e9e2199c7	2026-04-09 22:23:46.583214+00	20240814202359_integrations_unification	\N	\N	2026-04-09 22:23:46.527328+00	1
e222f94b-0378-4ba3-aba0-9e3659f4ab2c	a363a9ebc5bb526e504c4e6f71ed7702a5b6d317db6a9981f36c4560f9147fba	2026-04-09 22:23:46.634126+00	20240821120816_bot_id_integration_session	\N	\N	2026-04-09 22:23:46.621004+00	1
c9ed62c4-73b3-48bb-906d-90ca9b00d1c1	e31947e6c709ee3a62504980ae9ab1ffbfd9faf0cf9ac389cfd6435734c49902	2026-04-09 22:23:46.69881+00	20240821171327_add_generic_bot_table	\N	\N	2026-04-09 22:23:46.637404+00	1
519f15cf-b2d6-4768-b1ee-f905eef465dc	18dde8e48c49a97f33f5b789ccd919326253c26d43af72c77f6b13d4285ffba8	2026-04-09 22:23:46.792831+00	20240821194524_add_flowise_table	\N	\N	2026-04-09 22:23:46.70292+00	1
8cd0d7a3-1cc4-49ef-9a9e-0e510f2c8c07	0148a09e0e5eedafe5c5169c6351201a5c70ebaa853456693d75a7b82a851dbe	2026-04-09 22:23:46.807698+00	20240824161333_add_type_on_integration_sessions	\N	\N	2026-04-09 22:23:46.796462+00	1
b7409463-7b03-44b9-8f27-dd0879e3c613	710e7ee3aabf07aa6ee9bf2865c09f75d461efa5724dd83f5a6f324ea1e5e47c	2026-04-09 22:23:46.894389+00	20240825130616_change_to_evolution_bot	\N	\N	2026-04-09 22:23:46.811721+00	1
2e3da35e-e4c5-4a34-90a8-4428a2088c74	d03a8a31df36eb0a07e80cd2a149b6d826e69bb2cb21fbe69943ae5ffba672ad	2026-04-09 22:23:46.942465+00	20240828140837_add_is_on_whatsapp_table	\N	\N	2026-04-09 22:23:46.908597+00	1
b8e7622f-0424-464e-bcf3-16e41610c342	e927e00343b622bee7dab1b9b5c9fdd95007bfaf9d705ec52db9ecb05fb3d078	2026-04-09 22:23:46.966103+00	20240828141556_remove_name_column_from_on_whatsapp_table	\N	\N	2026-04-09 22:23:46.953132+00	1
c0b82d31-fe72-4c82-b4cc-6906d6e354d8	cf00d8ef2c28cf94aea51e7e2a80ddd65474a4f6c1113abc65dea6cc194c1a57	2026-04-09 22:23:47.040625+00	20240830193533_changed_table_case	\N	\N	2026-04-09 22:23:46.973673+00	1
8fa9ff43-a5ae-4782-a16e-52e9b508aaae	1cc60b9c38db62b694f753e2ee4c155e95c66815b5800f6ddb6f7cddec23b1ad	2026-04-09 22:23:47.055077+00	20240906202019_add_headers_on_webhook_config	\N	\N	2026-04-09 22:23:47.04405+00	1
312e6537-5ed4-4061-8086-b124bae85a76	7dff7227c1e013127210ab4f77b91dc24eae14bcd07f21fb27aaa2fa82b23865	2026-04-10 04:02:04.021316+00	20241001180457_add_message_status	\N	\N	2026-04-10 04:02:03.921394+00	1
9e679545-0597-4b5c-ab40-e1b5a8022f17	07449acbac59175f82670f34664c1dcea4d34f9a1710f19bd3396e26868db09e	2026-04-10 04:02:04.273109+00	20241006130306_alter_status_on_message_table	\N	\N	2026-04-10 04:02:04.053238+00	1
c094302c-6e14-4090-913c-db6012af2d8e	7e9a7c45f05285e9fea38ccfa4266790a099107605299d81c309e689c06494ef	2026-04-10 04:02:04.302712+00	20241007164026_add_unread_messages_on_chat_table	\N	\N	2026-04-10 04:02:04.278232+00	1
6490f614-3c5b-423f-9d9d-ce901a3f28ef	7e3e4686eb8009cbf0f71e8606a442b1c2862673dbc654b3f36f39a36efcb586	2026-04-10 04:02:04.43329+00	20241011085129_create_pusher_table	\N	\N	2026-04-10 04:02:04.317175+00	1
f89c72ee-58aa-4757-964b-8b5bee832b0e	270e1e51c7b9d24c0e68708ad167cb5748d591fd194ad422486574a0e83c0b79	2026-04-10 04:02:04.472034+00	20241011100803_split_messages_and_time_per_char_integrations	\N	\N	2026-04-10 04:02:04.437496+00	1
ed18f59d-b69d-46d0-89b9-e6e3181b9702	e82282df963a32556a9c8cd5fd908dd5810d4c35f0d7765ab9e844ebad1106a2	2026-04-10 04:02:04.619589+00	20241017144950_create_index	\N	\N	2026-04-10 04:02:04.476836+00	1
1db07b51-0ad5-48fa-a008-68e78b5e9608	13f95f18438e1d778d8ffc96873625c2804efd732dc3db0c27209ce17e82ed57	2026-04-10 04:02:04.730287+00	20250116001415_add_wavoip_token_to_settings_table	\N	\N	2026-04-10 04:02:04.634424+00	1
\.


--
-- Name: Chat Chat_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY (id);


--
-- Name: Chatwoot Chatwoot_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Chatwoot"
    ADD CONSTRAINT "Chatwoot_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: DifySetting DifySetting_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."DifySetting"
    ADD CONSTRAINT "DifySetting_pkey" PRIMARY KEY (id);


--
-- Name: Dify Dify_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Dify"
    ADD CONSTRAINT "Dify_pkey" PRIMARY KEY (id);


--
-- Name: EvolutionBotSetting EvolutionBotSetting_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_pkey" PRIMARY KEY (id);


--
-- Name: EvolutionBot EvolutionBot_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_pkey" PRIMARY KEY (id);


--
-- Name: FlowiseSetting FlowiseSetting_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_pkey" PRIMARY KEY (id);


--
-- Name: Flowise Flowise_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Flowise"
    ADD CONSTRAINT "Flowise_pkey" PRIMARY KEY (id);


--
-- Name: Instance Instance_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Instance"
    ADD CONSTRAINT "Instance_pkey" PRIMARY KEY (id);


--
-- Name: IntegrationSession IntegrationSession_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_pkey" PRIMARY KEY (id);


--
-- Name: IsOnWhatsapp IsOnWhatsapp_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."IsOnWhatsapp"
    ADD CONSTRAINT "IsOnWhatsapp_pkey" PRIMARY KEY (id);


--
-- Name: Label Label_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Label"
    ADD CONSTRAINT "Label_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: MessageUpdate MessageUpdate_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiBot OpenaiBot_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiCreds OpenaiCreds_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiSetting OpenaiSetting_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_pkey" PRIMARY KEY (id);


--
-- Name: Proxy Proxy_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Proxy"
    ADD CONSTRAINT "Proxy_pkey" PRIMARY KEY (id);


--
-- Name: Pusher Pusher_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Pusher"
    ADD CONSTRAINT "Pusher_pkey" PRIMARY KEY (id);


--
-- Name: Rabbitmq Rabbitmq_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: Sqs Sqs_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Sqs"
    ADD CONSTRAINT "Sqs_pkey" PRIMARY KEY (id);


--
-- Name: Template Template_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY (id);


--
-- Name: TypebotSetting TypebotSetting_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_pkey" PRIMARY KEY (id);


--
-- Name: Typebot Typebot_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Typebot"
    ADD CONSTRAINT "Typebot_pkey" PRIMARY KEY (id);


--
-- Name: Webhook Webhook_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Webhook"
    ADD CONSTRAINT "Webhook_pkey" PRIMARY KEY (id);


--
-- Name: Websocket Websocket_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Websocket"
    ADD CONSTRAINT "Websocket_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Chat_instanceId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Chat_instanceId_idx" ON evolution_api."Chat" USING btree ("instanceId");


--
-- Name: Chat_remoteJid_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Chat_remoteJid_idx" ON evolution_api."Chat" USING btree ("remoteJid");


--
-- Name: Chatwoot_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Chatwoot_instanceId_key" ON evolution_api."Chatwoot" USING btree ("instanceId");


--
-- Name: Contact_instanceId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Contact_instanceId_idx" ON evolution_api."Contact" USING btree ("instanceId");


--
-- Name: Contact_remoteJid_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Contact_remoteJid_idx" ON evolution_api."Contact" USING btree ("remoteJid");


--
-- Name: Contact_remoteJid_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Contact_remoteJid_instanceId_key" ON evolution_api."Contact" USING btree ("remoteJid", "instanceId");


--
-- Name: DifySetting_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "DifySetting_instanceId_key" ON evolution_api."DifySetting" USING btree ("instanceId");


--
-- Name: EvolutionBotSetting_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "EvolutionBotSetting_instanceId_key" ON evolution_api."EvolutionBotSetting" USING btree ("instanceId");


--
-- Name: FlowiseSetting_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "FlowiseSetting_instanceId_key" ON evolution_api."FlowiseSetting" USING btree ("instanceId");


--
-- Name: Instance_name_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Instance_name_key" ON evolution_api."Instance" USING btree (name);


--
-- Name: IsOnWhatsapp_remoteJid_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "IsOnWhatsapp_remoteJid_key" ON evolution_api."IsOnWhatsapp" USING btree ("remoteJid");


--
-- Name: Label_labelId_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Label_labelId_instanceId_key" ON evolution_api."Label" USING btree ("labelId", "instanceId");


--
-- Name: Media_fileName_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Media_fileName_key" ON evolution_api."Media" USING btree ("fileName");


--
-- Name: Media_messageId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Media_messageId_key" ON evolution_api."Media" USING btree ("messageId");


--
-- Name: MessageUpdate_instanceId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "MessageUpdate_instanceId_idx" ON evolution_api."MessageUpdate" USING btree ("instanceId");


--
-- Name: MessageUpdate_messageId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "MessageUpdate_messageId_idx" ON evolution_api."MessageUpdate" USING btree ("messageId");


--
-- Name: Message_instanceId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Message_instanceId_idx" ON evolution_api."Message" USING btree ("instanceId");


--
-- Name: OpenaiCreds_apiKey_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiCreds_apiKey_key" ON evolution_api."OpenaiCreds" USING btree ("apiKey");


--
-- Name: OpenaiCreds_name_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiCreds_name_key" ON evolution_api."OpenaiCreds" USING btree (name);


--
-- Name: OpenaiSetting_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiSetting_instanceId_key" ON evolution_api."OpenaiSetting" USING btree ("instanceId");


--
-- Name: OpenaiSetting_openaiCredsId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiSetting_openaiCredsId_key" ON evolution_api."OpenaiSetting" USING btree ("openaiCredsId");


--
-- Name: Proxy_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Proxy_instanceId_key" ON evolution_api."Proxy" USING btree ("instanceId");


--
-- Name: Pusher_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Pusher_instanceId_key" ON evolution_api."Pusher" USING btree ("instanceId");


--
-- Name: Rabbitmq_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Rabbitmq_instanceId_key" ON evolution_api."Rabbitmq" USING btree ("instanceId");


--
-- Name: Session_sessionId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionId_key" ON evolution_api."Session" USING btree ("sessionId");


--
-- Name: Setting_instanceId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Setting_instanceId_idx" ON evolution_api."Setting" USING btree ("instanceId");


--
-- Name: Setting_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_instanceId_key" ON evolution_api."Setting" USING btree ("instanceId");


--
-- Name: Sqs_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Sqs_instanceId_key" ON evolution_api."Sqs" USING btree ("instanceId");


--
-- Name: Template_name_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Template_name_key" ON evolution_api."Template" USING btree (name);


--
-- Name: Template_templateId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Template_templateId_key" ON evolution_api."Template" USING btree ("templateId");


--
-- Name: TypebotSetting_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "TypebotSetting_instanceId_key" ON evolution_api."TypebotSetting" USING btree ("instanceId");


--
-- Name: Webhook_instanceId_idx; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE INDEX "Webhook_instanceId_idx" ON evolution_api."Webhook" USING btree ("instanceId");


--
-- Name: Webhook_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Webhook_instanceId_key" ON evolution_api."Webhook" USING btree ("instanceId");


--
-- Name: Websocket_instanceId_key; Type: INDEX; Schema: evolution_api; Owner: postgres
--

CREATE UNIQUE INDEX "Websocket_instanceId_key" ON evolution_api."Websocket" USING btree ("instanceId");


--
-- Name: Chat Chat_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Chat"
    ADD CONSTRAINT "Chat_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chatwoot Chatwoot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Chatwoot"
    ADD CONSTRAINT "Chatwoot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contact Contact_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Contact"
    ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DifySetting DifySetting_difyIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."DifySetting"
    ADD CONSTRAINT "DifySetting_difyIdFallback_fkey" FOREIGN KEY ("difyIdFallback") REFERENCES evolution_api."Dify"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DifySetting DifySetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."DifySetting"
    ADD CONSTRAINT "DifySetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dify Dify_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Dify"
    ADD CONSTRAINT "Dify_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvolutionBotSetting EvolutionBotSetting_botIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_botIdFallback_fkey" FOREIGN KEY ("botIdFallback") REFERENCES evolution_api."EvolutionBot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvolutionBotSetting EvolutionBotSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvolutionBot EvolutionBot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowiseSetting FlowiseSetting_flowiseIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_flowiseIdFallback_fkey" FOREIGN KEY ("flowiseIdFallback") REFERENCES evolution_api."Flowise"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FlowiseSetting FlowiseSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Flowise Flowise_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Flowise"
    ADD CONSTRAINT "Flowise_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IntegrationSession IntegrationSession_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Label Label_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Label"
    ADD CONSTRAINT "Label_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Media"
    ADD CONSTRAINT "Media_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_messageId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Media"
    ADD CONSTRAINT "Media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES evolution_api."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageUpdate MessageUpdate_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageUpdate MessageUpdate_messageId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES evolution_api."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Message"
    ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_sessionId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Message"
    ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES evolution_api."IntegrationSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OpenaiBot OpenaiBot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiBot OpenaiBot_openaiCredsId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES evolution_api."OpenaiCreds"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiCreds OpenaiCreds_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiSetting OpenaiSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiSetting OpenaiSetting_openaiCredsId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES evolution_api."OpenaiCreds"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OpenaiSetting OpenaiSetting_openaiIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiIdFallback_fkey" FOREIGN KEY ("openaiIdFallback") REFERENCES evolution_api."OpenaiBot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Proxy Proxy_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Proxy"
    ADD CONSTRAINT "Proxy_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pusher Pusher_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Pusher"
    ADD CONSTRAINT "Pusher_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rabbitmq Rabbitmq_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_sessionId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Session"
    ADD CONSTRAINT "Session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Setting Setting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Setting"
    ADD CONSTRAINT "Setting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sqs Sqs_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Sqs"
    ADD CONSTRAINT "Sqs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Template Template_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Template"
    ADD CONSTRAINT "Template_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TypebotSetting TypebotSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TypebotSetting TypebotSetting_typebotIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_typebotIdFallback_fkey" FOREIGN KEY ("typebotIdFallback") REFERENCES evolution_api."Typebot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Typebot Typebot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Typebot"
    ADD CONSTRAINT "Typebot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Webhook Webhook_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Webhook"
    ADD CONSTRAINT "Webhook_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Websocket Websocket_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution_api; Owner: postgres
--

ALTER TABLE ONLY evolution_api."Websocket"
    ADD CONSTRAINT "Websocket_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution_api."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LSgEu9eO8kX6uibyTurPrgDG1HyFHwm9A2QseMNrIZpzaAFBTSqA6hOPhzzZO2Q

