/**
 * Industry Demo Routes
 *
 * Exposes API endpoints for the Recruiter/Industry Demo Mode.
 * Protected by authentication middleware or demo accessible for evaluation.
 */

import { Router, Request, Response } from 'express';
import {
  getIndustryDemoStats,
  getIndustryDemoOpportunities,
  getIndustryDemoOpportunityApplicants,
  getIndustryDemoCandidates,
  getIndustryDemoCandidateById,
  compareIndustryDemoCandidates,
  getIndustryDemoAnalytics,
  resetIndustryDemoData,
} from '../services/industryDemoService.js';

export const industryDemoRouter = Router();

// Stats (Dynamic calculation across all 410 records)
industryDemoRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getIndustryDemoStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching industry demo stats:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demo stats' });
  }
});

// Opportunities
industryDemoRouter.get('/opportunities', async (_req: Request, res: Response) => {
  try {
    const opportunities = await getIndustryDemoOpportunities();
    res.json({ success: true, data: opportunities });
  } catch (error: any) {
    console.error('Error fetching industry demo opportunities:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demo opportunities' });
  }
});

// Opportunity Applicants
industryDemoRouter.get('/opportunities/:id/applicants', async (req: Request, res: Response) => {
  try {
    const data = await getIndustryDemoOpportunityApplicants(req.params.id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching demo opportunity applicants:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch opportunity applicants' });
  }
});

// Candidates List with filtering
industryDemoRouter.get('/candidates', async (req: Request, res: Response) => {
  try {
    const filter = {
      university: req.query.university as string | undefined,
      skill: req.query.skill as string | undefined,
      branch: req.query.branch as string | undefined,
      minScore: req.query.minScore ? parseFloat(req.query.minScore as string) : undefined,
      maxScore: req.query.maxScore ? parseFloat(req.query.maxScore as string) : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };
    const result = await getIndustryDemoCandidates(filter);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error fetching demo candidates:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demo candidates' });
  }
});

// Single Candidate Profile
industryDemoRouter.get('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const data = await getIndustryDemoCandidateById(req.params.id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching demo candidate profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demo candidate' });
  }
});

// 2-5 Candidate Comparison with AI synthesis
industryDemoRouter.post('/compare', async (req: Request, res: Response) => {
  try {
    const { candidateIds, opportunityId } = req.body;
    if (!candidateIds || !Array.isArray(candidateIds) || !opportunityId) {
      return res.status(400).json({
        success: false,
        message: 'candidateIds (array of 2-5 IDs) and opportunityId are required.',
      });
    }
    const comparison = await compareIndustryDemoCandidates(candidateIds, opportunityId);
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    console.error('Error comparing demo candidates:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to compare candidates' });
  }
});

// Analytics & Funnel
industryDemoRouter.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const analytics = await getIndustryDemoAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    console.error('Error fetching demo analytics:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demo analytics' });
  }
});

// Reset Demo Data
industryDemoRouter.post('/reset', async (_req: Request, res: Response) => {
  try {
    const result = await resetIndustryDemoData();
    res.json({ success: true, message: 'Industry demo data reset successfully', data: result });
  } catch (error: any) {
    console.error('Error resetting demo data:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset demo data' });
  }
});
