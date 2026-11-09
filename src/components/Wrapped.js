import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toBlob } from "html-to-image";

import Loading from "./Loading";
import WrappedShareCard from "./WrappedShareCard";
import { authFetch } from "../utils/api";
import { buildSlides, defaultWrappedYear, shareText } from "../utils/wrapped";
import { useAuth } from "../utils/auth";

const trackShare = (method) => {
    if (typeof window.gtag === "function") {
        window.gtag("event", "wrapped_share", { method });
    }
};

const downloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
};

const Slide = ({ slide }) => (
    <>
        <p className="wrapped-eyebrow">{slide.eyebrow}</p>
        {slide.emoji && <p className="wrapped-emoji">{slide.emoji}</p>}
        {slide.big && <p className="wrapped-big">{slide.big}</p>}
        <h1 className="wrapped-headline">{slide.headline}</h1>
        <p className="wrapped-sub">{slide.sub}</p>
        {slide.link && (
            <a className="wrapped-link" href={slide.link.href} onClick={(evt) => evt.stopPropagation()}>
                {slide.link.label} →
            </a>
        )}
    </>
);

const ShareView = ({ data }) => {
    const cardRef = useRef(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(false);
    const text = shareText(data);

    // Generate the PNG up front: Safari only allows navigator.share() right after a tap,
    // so it can't wait on image rendering inside the click handler.
    useEffect(() => {
        let cancelled = false;
        const generate = async () => {
            try {
                await document.fonts.ready;
                const blob = await toBlob(cardRef.current, { pixelRatio: 3, cacheBust: true });
                if (cancelled) return;
                const png = new File([blob], `stroller-wrapped-${data.year}.png`, { type: "image/png" });
                setFile(png);
                setPreviewUrl(URL.createObjectURL(png));
            } catch (e) {
                console.error("Error generating wrapped image:", e);
                if (!cancelled) setError(true);
            }
        };
        generate();
        return () => { cancelled = true; };
    }, [data]);

    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    const canShareFile = !!file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

    const share = async () => {
        trackShare("native");
        try {
            await navigator.share({ files: [file], text });
        } catch (e) {
            if (e.name !== "AbortError") {
                console.error("Error sharing wrapped:", e);
                downloadFile(file);
            }
        }
    };

    const download = () => {
        trackShare("download");
        downloadFile(file);
    };

    // Bluesky's compose link only takes text, so save the image for the user to attach.
    const bluesky = () => {
        trackShare("bluesky");
        downloadFile(file);
        window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    };

    return (
        <section className="wrapped-share">
            <div className="wrapped-card-offscreen" aria-hidden="true">
                <WrappedShareCard ref={cardRef} data={data} />
            </div>
            <p className="wrapped-eyebrow">SHARE_YOUR_WRAPPED</p>
            {error && <p>Couldn't make your image. Try refreshing the page.</p>}
            {!error && !previewUrl && <Loading />}
            {previewUrl && (
                <>
                    <img className="wrapped-preview" src={previewUrl} alt={`Stroller Wrapped ${data.year} card`} />
                    <div className="wrapped-share-buttons">
                        {canShareFile && <button className="wrapped-button primary" onClick={share}>Share</button>}
                        <button className={`wrapped-button${canShareFile ? "" : " primary"}`} onClick={download}>Download image</button>
                        <button className="wrapped-button" onClick={bluesky}>Post on Bluesky</button>
                    </div>
                    <p className="wrapped-hint">
                        {canShareFile
                            ? "Posting to Instagram? Tap Share and pick Instagram to add it to your story."
                            : "Posting to Instagram? Download the image, then share it from your phone."}
                        {" "}For Bluesky, attach the image we just saved.
                    </p>
                </>
            )}
        </section>
    );
};

const Wrapped = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const year = searchParams.get("year") || defaultWrappedYear();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }
        const getData = async () => {
            try {
                const response = await authFetch(`/me/wrapped/${year}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                setData(await response.json());
            } catch (e) {
                console.error("Error fetching wrapped:", e);
                setError(true);
            }
        };
        getData();
    }, [user, navigate, year]);

    const slides = useMemo(() => (data ? buildSlides(data) : []), [data]);
    const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), [slides.length]);
    const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

    useEffect(() => {
        const onKey = (evt) => {
            if (evt.key === "ArrowRight") next();
            if (evt.key === "ArrowLeft") prev();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [next, prev]);

    if (error) {
        return <main><p>Couldn't load your Wrapped. Try refreshing the page.</p></main>;
    }
    if (!data) {
        return <main><Loading /></main>;
    }
    if (slides.length === 0) {
        return (
            <main className="wrapped">
                <section className="wrapped-slide">
                    <p className="wrapped-eyebrow">STROLLER_WRAPPED_{data.year}</p>
                    <p className="wrapped-emoji">👀</p>
                    <h1 className="wrapped-headline">no stroller {data.distance_unit}s in {data.year} yet.</h1>
                    <p className="wrapped-sub">add #strollerstats to your next Strava run or walk and we'll start counting.</p>
                    <a className="wrapped-link" href="/about">how it works →</a>
                </section>
            </main>
        );
    }

    const slide = slides[index];

    return (
        <main className="wrapped">
            <div className="wrapped-progress">
                {slides.map((s, i) => <span key={s.key} className={i <= index ? "done" : ""} />)}
            </div>
            {slide.key === "share" ? (
                <ShareView data={data} />
            ) : (
                <section className="wrapped-slide" onClick={next}>
                    <Slide slide={slide} />
                    <p className="wrapped-tap">tap to continue</p>
                </section>
            )}
            <div className="wrapped-controls">
                <button className="wrapped-button" onClick={prev} disabled={index === 0}>‹ back</button>
                {slide.key !== "share" && <button className="wrapped-button" onClick={next}>next ›</button>}
            </div>
        </main>
    );
};

export default Wrapped;
