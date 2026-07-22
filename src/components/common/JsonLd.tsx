interface JsonLdProps {
  data: object;
}

/** Renders a Schema.org script block (works during SSR prerender — important for SEO). */
export const JsonLd = ({ data }: JsonLdProps) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);
