import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function TermsPublic({ latest }: { latest?: boolean }){
  const { slug, version } = useParams();
  const [content, setContent] = useState<string>('');
  const [sp] = useSearchParams();

  useEffect(()=>{
    (async () => {
      let url = '';
      if (latest) {
        url = `${API}/terms/public/latest`;
      } else if (slug && version) {
        url = `${API}/terms/public/${slug}/${version}`;
      }
      if (url) {
        const res = await fetch(url);
        setContent(await res.text());
      }
    })();
  }, [slug, version, latest]);

  return (
    <div className="prose dark:prose-invert max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
