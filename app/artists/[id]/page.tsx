"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ARTISTS, TRACKS, ALBUMS } from "@/lib/demo-data";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import Artwork from "@/components/ui/Artwork";

export default function ArtistPage() {
  const params = useParams();
  const id = params.id as string;
  const artist = ARTISTS.find((a) => a.id === id);
  const { followedArtists, followArtist, unfollowArtist } = useLibraryStore();
  const playTrack = usePlayerStore((s) => s.playTrack);
  if (!artist) return <div className="p-8 text-muted">Artist not found.</div>;
  const tracks = TRACKS.filter((t) => t.artistId === artist.id);
  const albums = ALBUMS.filter((a) => a.artistId === artist.id);
  const following = followedArtists.includes(artist.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-5xl font-bold">
          {artist.name[0]}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-3xl font-bold">{artist.name}</h1>
          <div className="text-muted text-sm mt-1">{artist.bio}</div>
          <div className="text-xs text-muted mt-2">{(artist.followers/1000).toFixed(0)}K followers</div>
          <button onClick={() => following ? unfollowArtist(artist.id) : followArtist(artist.id)}
            className={`mt-4 px-5 py-2 rounded-full text-sm font-medium ${following ? "glass" : "bg-white text-black"}`}>
            {following ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {albums.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((a) => (
              <div key={a.id} className="glass rounded-xl p-3">
                <Artwork seed={a.seed} size={0} className="w-full aspect-square mb-2 rounded-lg" />
                <div className="text-sm font-medium truncate">{a.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Top Tracks</h2>
        <div className="space-y-1">
          {tracks.map((t, i) => (
            <div key={t.id} onClick={() => playTrack(t, tracks)} className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer">
              <span className="text-muted text-sm w-6">{i + 1}</span>
              <Artwork seed={t.artworkSeed} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted truncate">{t.album}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
