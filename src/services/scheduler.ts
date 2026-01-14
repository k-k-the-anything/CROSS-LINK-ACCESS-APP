/**
 * Scheduler Service
 * 
 * Manages scheduled posts and their execution timing.
 * Uses a polling-based approach that can work in both foreground and background.
 */

import { usePostStore } from '../stores';
import type { Post, CrossPostTarget } from '../types';

export interface ScheduledJob {
    id: string;
    postId: string;
    scheduledAt: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    retryCount: number;
    maxRetries: number;
    lastError?: string;
}

export class SchedulerService {
    private jobs: Map<string, ScheduledJob> = new Map();
    private checkInterval: number | null = null;
    private isRunning = false;
    private readonly CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

    /**
     * Start the scheduler
     */
    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.checkInterval = window.setInterval(() => {
            this.processScheduledPosts();
        }, this.CHECK_INTERVAL_MS);

        // Initial check
        this.processScheduledPosts();
        console.log('[Scheduler] Started');
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.checkInterval !== null) {
            window.clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('[Scheduler] Stopped');
    }

    /**
     * Add a scheduled post
     */
    schedulePost(post: Post, scheduledAt: Date): ScheduledJob {
        const job: ScheduledJob = {
            id: crypto.randomUUID(),
            postId: post.id,
            scheduledAt,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
        };

        this.jobs.set(job.id, job);
        console.log(`[Scheduler] Scheduled post ${post.id} for ${scheduledAt.toISOString()}`);

        return job;
    }

    /**
     * Cancel a scheduled post
     */
    cancelScheduledPost(jobId: string): boolean {
        const job = this.jobs.get(jobId);
        if (job && job.status === 'pending') {
            this.jobs.delete(jobId);
            console.log(`[Scheduler] Cancelled job ${jobId}`);
            return true;
        }
        return false;
    }

    /**
     * Get all scheduled jobs
     */
    getScheduledJobs(): ScheduledJob[] {
        return Array.from(this.jobs.values()).filter(job => job.status === 'pending');
    }

    /**
     * Get jobs for a specific date range
     */
    getJobsInRange(start: Date, end: Date): ScheduledJob[] {
        return Array.from(this.jobs.values()).filter(job => {
            const jobTime = new Date(job.scheduledAt).getTime();
            return jobTime >= start.getTime() && jobTime <= end.getTime();
        });
    }

    /**
     * Process scheduled posts that are due
     */
    private async processScheduledPosts(): Promise<void> {
        const now = new Date();
        const duePosts = Array.from(this.jobs.values()).filter(
            job => job.status === 'pending' && new Date(job.scheduledAt) <= now
        );

        for (const job of duePosts) {
            await this.executeJob(job);
        }
    }

    /**
     * Execute a scheduled job
     */
    private async executeJob(job: ScheduledJob): Promise<void> {
        job.status = 'processing';
        console.log(`[Scheduler] Executing job ${job.id} for post ${job.postId}`);

        try {
            // Get the post from store
            const postStore = usePostStore.getState();
            const post = postStore.posts.find(p => p.id === job.postId);

            if (!post) {
                throw new Error('Post not found');
            }

            // Update post status
            postStore.updatePost(job.postId, { status: 'posting' });

            // Execute cross-posting for each target
            // Note: In a full implementation, this would call the platform services
            const results = await this.executePostToAllTargets(post);

            // Check results
            const allSuccess = results.every(r => r.success);
            const anySuccess = results.some(r => r.success);

            if (allSuccess) {
                job.status = 'completed';
                postStore.updatePost(job.postId, {
                    status: 'posted',
                    postedAt: new Date(),
                });
            } else if (anySuccess) {
                job.status = 'completed';
                postStore.updatePost(job.postId, { status: 'partial' });
            } else {
                throw new Error('All platforms failed');
            }

            console.log(`[Scheduler] Job ${job.id} completed`);
        } catch (error) {
            job.retryCount++;
            job.lastError = error instanceof Error ? error.message : 'Unknown error';

            if (job.retryCount >= job.maxRetries) {
                job.status = 'failed';
                const postStore = usePostStore.getState();
                postStore.updatePost(job.postId, { status: 'failed' });
                console.log(`[Scheduler] Job ${job.id} failed after ${job.retryCount} retries`);
            } else {
                job.status = 'pending';
                // Schedule retry in 5 minutes
                job.scheduledAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log(`[Scheduler] Job ${job.id} will retry at ${job.scheduledAt.toISOString()}`);
            }
        }
    }

    /**
     * Execute post to all targets
     * Note: This is a placeholder. Full implementation would use platform services.
     */
    private async executePostToAllTargets(post: Post): Promise<{ targetId: string; success: boolean; error?: string }[]> {
        const results: { targetId: string; success: boolean; error?: string }[] = [];

        for (const target of post.crossPostTargets) {
            try {
                // Simulate posting delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // In full implementation, call appropriate service:
                // - blueskyService.createPost()
                // - youtubeService.uploadVideo()
                // - instagramService.createPost()
                // - threadsService.createPost()

                results.push({ targetId: target.id, success: true });
            } catch (error) {
                results.push({
                    targetId: target.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return results;
    }

    /**
     * Get scheduler status
     */
    isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Get pending jobs count
     */
    getPendingCount(): number {
        return Array.from(this.jobs.values()).filter(j => j.status === 'pending').length;
    }
}

// Singleton instance
export const schedulerService = new SchedulerService();
