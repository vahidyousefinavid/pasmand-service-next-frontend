import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "شهر شهر | جمع‌آوران",
        short_name: "شهر شهر | جمع‌آوران",
        description: "برنامهٔ خدمات‌دهندگان سامانهٔ خدمات شهری شهر شهر — پذیرش و جمع‌آوری پسماند",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#00613b",
        icons: [
            {
                src: "/icons/icon-128.png",
                sizes: "128x128",
                type: "image/png"
            },
            {
                src: "/icons/icon-144.png",
                sizes: "144x144",
                type: "image/png"
            },
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/icons/icon-384.png",
                sizes: "384x384",
                type: "image/png"
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png"
            },
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable"
            }
        ]
    }
}