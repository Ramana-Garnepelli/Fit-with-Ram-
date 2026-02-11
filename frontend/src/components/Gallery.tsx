'use client';

export default function Gallery() {
    const images = [
        { src: '/uploads/RAMANAGYMPIC-1.jpg', title: 'Transformation Phase 1' },
        { src: '/uploads/RAMANAGYMPIC-2.jpg', title: 'Transformation Phase 2' },
        { src: '/uploads/RAMANAGYMPIC-3.jpg', title: 'Transformation Phase 3' },
    ];

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-4xl font-black text-center mb-16 text-gray-900 tracking-tight">
                    REAL <span className="text-[#00f2ea]">RESULTS</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {images.map((img, index) => (
                        <div key={index} className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500">
                            <div className="aspect-[3/4]">
                                <img
                                    src={img.src}
                                    alt={img.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop';
                                    }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <p className="text-xl font-bold text-[#00f2ea]">{img.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
