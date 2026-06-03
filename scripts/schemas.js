import { z } from "zod";

export const LinkItemSchema = z.object({
  icon: z.string().optional(),
  title: z.string(),
  titleEN: z.string().optional(),
  description: z.string().optional(),
  link: z.string(),
  target: z.string().optional(),
});

export const SectionSchema = z.object({
  title: z.string().optional(),
  desc: z.string().optional(),
  items: z.array(LinkItemSchema),
});

export const InnerLinkConfigSchema = z.object({
  title: z.string().optional(),
  emoji: z.string().optional(),
  h1: z.string().optional(),
  headerDesc: z.string().optional(),
  ogImage: z.string().optional(),
  image: z.string().optional(),
  backLink: z.string().optional(),
  sections: z.array(SectionSchema),
});

export const ExternalLinkItemSchema = z.object({
  url: z.string(),
  title: z.string(),
  titleEN: z.string().optional(),
  description: z.string().optional(),
});

export const ExternalLinkSectionSchema = z.object({
  title: z.string(),
  items: z.array(ExternalLinkItemSchema),
});

export const ExternalLinkConfigSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(["forms", "learning"]),
  icon: z.string().optional(),
  titleEN: z.string().optional(),
  note: z.string().optional(),
  order: z.number().optional(),
  sections: z.array(ExternalLinkSectionSchema),
});
