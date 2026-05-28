import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";
import { 
  BookOpen, 
  Play, 
  Clock, 
  Calendar,
  User as UserIcon,
  Tag,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CourseDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const { getToken } = await auth();
  const token = await getToken();

  let course: any = null;
  let videos: any[] = [];

  try {
    // Fetch course details (Teacher endpoint but accessible by admin)
    const courseRes = await api.get(`/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    course = courseRes.data;

    // Fetch videos
    const videosRes = await api.get(`/courses/${id}/videos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    videos = videosRes.data;
  } catch (error) {
    console.error("Failed to fetch course details:", error);
    // If not found or unauthorized, redirect back
    redirect("/courses");
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link 
            href="/courses" 
            className="group mb-4 inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Catalog
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{course.title}</h1>
          <p className="mt-2 text-lg text-slate-500 max-w-3xl">{course.description || "No description provided for this course."}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ring-1 ${
            course.isPublished 
              ? "bg-green-100 text-green-700 ring-1 ring-green-600/20" 
              : "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20"
          }`}>
            {course.isPublished ? "Published" : "Draft"}
          </div>
          <div className="rounded-full bg-blue-100 px-4 py-1 text-xs font-black uppercase tracking-widest text-blue-700 ring-1 ring-blue-600/20">
            {course.category || "General"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Course Info & Videos */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Content Area (Videos) */}
          <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 flex items-center text-xl font-bold text-slate-900">
              <Play className="mr-3 h-5 w-5 text-blue-600" />
              Course Curriculum
            </h2>
            
            <div className="space-y-4">
              {videos.length > 0 ? (
                videos.map((video, index) => (
                  <div 
                    key={video._id} 
                    className="group flex flex-col gap-4 rounded-xl border-2 border-slate-50 bg-slate-50/50 p-4 transition-all hover:border-blue-100 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white font-black text-slate-400 shadow-sm ring-1 ring-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600 transition-all">
                          {index + 1}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-bold text-slate-900 line-clamp-1">{video.title}</h3>
                          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            <span className="flex items-center italic">
                              <Clock className="mr-1 h-3 w-3" />
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <span className="hidden sm:inline-block rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                            Video Lesson
                         </span>
                      </div>
                    </div>
                    
                    {/* Video Player Preview (Admin only) */}
                    <div className="overflow-hidden rounded-lg bg-slate-900 shadow-inner">
                      <video 
                        controls 
                        className="aspect-video w-full"
                        poster={course.thumbnailUrl || undefined}
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl">
                  No videos have been uploaded to this course yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Metadata</h3>
            <dl className="space-y-4">
              <div className="flex flex-col">
                <dt className="flex items-center text-xs font-bold text-slate-500 uppercase">
                  <UserIcon className="mr-2 h-3.5 w-3.5" />
                  Instructor
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {course.teacherName || "Unknown Teacher"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Email Address
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold text-slate-600 truncate bg-slate-50 p-2 rounded border border-slate-200" title={course.teacherEmail}>
                  {course.teacherEmail || "N/A"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center text-xs font-bold text-slate-500 uppercase">
                  <Calendar className="mr-2 h-3.5 w-3.5" />
                  Created Date
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {new Date(course.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center text-xs font-bold text-slate-500 uppercase">
                  <Tag className="mr-2 h-3.5 w-3.5" />
                  Total Lessons
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {videos.length} Videos
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg shadow-blue-200">
            <h3 className="text-lg font-bold">Admin Privileges</h3>
            <p className="mt-2 text-sm text-blue-100 opacity-90 leading-relaxed">
              As an administrator, you have full visibility into this course. You can audit video content, check durations, and ensure compliance with platform standards.
            </p>
            <div className="mt-6 pt-4 border-t border-white/20">
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">System Note</p>
               <p className="text-xs mt-1 text-blue-100">Playback is unrestricted for administrative accounts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
