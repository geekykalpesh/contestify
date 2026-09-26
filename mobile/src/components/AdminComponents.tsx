import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import {
  Trophy,
  RefreshCw,
  Calendar,
  Users,
  Shield,
  CheckCircle2,
  FileCheck,
  Activity,
  Award,
  Server,
  Search,
  X,
  XCircle,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
} from 'lucide-react-native';
import { adminApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getMediaUrl } from '../config';
import { router } from 'expo-router';

// Subcomponent 1: AdminCreatorDetailsModal (Inspection modal with 4-week post breakdown)
const AdminCreatorDetailsModal: React.FC<{
  creator: any;
  onClose: () => void;
  onKycUpdate: (userId: string, status: string, notes?: string) => void;
  isDark: boolean;
}> = ({ creator, onClose, onKycUpdate, isDark }) => {
  const [activeModalTab, setActiveModalTab] = useState<'WEEKLY_BREAKDOWN' | 'ALL_POSTS' | 'KYC_STUDIO'>('WEEKLY_BREAKDOWN');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [kycNotes, setKycNotes] = useState('');

  if (!creator) return null;

  const uid = creator.id || creator.userId;
  const uname = creator.userName || creator.name || 'User';
  const uemail = creator.userEmail || creator.email || '';
  const usernameDisplay = creator.username || uemail?.split('@')[0] || uname.toLowerCase().replace(/\s+/g, '_');
  const isCG = creator.residency === 'Chhattisgarh' || creator.isChhattisgarh;
  const kyc = creator.kycDetails || {};

  const posts = creator.allPosts || creator.userPosts || [];
  const week1 = creator.week1Posts || [];
  const week2 = creator.week2Posts || [];
  const week3 = creator.week3Posts || [];
  const week4 = creator.week4Posts || [];

  const totalLikes = creator.totalLikes || posts.reduce((sum: number, p: any) => sum + (p.likeCount || p.likesCount || 0), 0);
  const totalComments = creator.totalComments || posts.reduce((sum: number, p: any) => sum + (p.commentCount || p.commentsCount || 0), 0);
  const totalViews = creator.totalViews || posts.reduce((sum: number, p: any) => sum + (p.viewCount || p.viewsCount || 0), 0);

  const handleKycStatusUpdate = (status: 'PASSED' | 'FAILED') => {
    onKycUpdate(uid || uemail, status, kycNotes || `KYC updated to ${status} from Creator Inspector Studio`);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.modalOverlay}>
        <View style={[modalStyles.modalCard, isDark ? modalStyles.darkCard : modalStyles.lightCard]}>
          {/* Header */}
          <View style={[modalStyles.modalHeader, isDark ? modalStyles.darkBorder : modalStyles.lightBorder]}>
            <View style={modalStyles.creatorHeaderLeft}>
              <View style={modalStyles.avatarBox}>
                <Text style={modalStyles.avatarText}>{uname ? uname[0].toUpperCase() : 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={modalStyles.nameBadgeRow}>
                  <Text style={[modalStyles.creatorNameText, isDark ? modalStyles.whiteText : modalStyles.blackText]} numberOfLines={1}>
                    {uname.replace(/\s*\([^)]*\)/g, '').trim()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      router.push(`/profile/${usernameDisplay || uid}`);
                    }}
                    style={modalStyles.usernameLink}
                  >
                    <Text style={modalStyles.usernameText}>@{usernameDisplay}</Text>
                    <ExternalLink size={10} color="#38bdf8" />
                  </TouchableOpacity>
                </View>
                <View style={modalStyles.emailSubRow}>
                  <Text style={[modalStyles.emailText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]} numberOfLines={1}>
                    {uemail} • ID: {uid}
                  </Text>
                  {isCG ? (
                    <View style={modalStyles.cgBadge}>
                      <Text style={modalStyles.cgBadgeText}>CG Resident</Text>
                    </View>
                  ) : (
                    <View style={modalStyles.nonCgBadge}>
                      <Text style={modalStyles.nonCgBadgeText}>{creator.residency || 'Outside CG'}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <X size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Metrics Row */}
          <View style={modalStyles.metricsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modalStyles.metricsScroll}>
              <View style={[modalStyles.metricCard, modalStyles.metricBlue]}>
                <Text style={modalStyles.metricLabel}>TOTAL POSTS</Text>
                <Text style={modalStyles.metricValue}>{creator.totalPosts || posts.length}</Text>
              </View>
              <View style={[modalStyles.metricCard, modalStyles.metricRose]}>
                <Text style={modalStyles.metricLabel}>TOTAL LIKES</Text>
                <Text style={modalStyles.metricValue}>{totalLikes}</Text>
              </View>
              <View style={[modalStyles.metricCard, modalStyles.metricSky]}>
                <Text style={modalStyles.metricLabel}>COMMENTS</Text>
                <Text style={modalStyles.metricValue}>{totalComments}</Text>
              </View>
              <View style={[modalStyles.metricCard, modalStyles.metricIndigo]}>
                <Text style={modalStyles.metricLabel}>VIEWS</Text>
                <Text style={modalStyles.metricValue}>{totalViews}</Text>
              </View>
              <View style={[modalStyles.metricCard, modalStyles.metricAmber]}>
                <Text style={modalStyles.metricLabel}>MAX SCORE</Text>
                <Text style={modalStyles.metricValue}>{creator.maxScore || creator.week1MaxScore || 0} pts</Text>
              </View>
              <View style={[modalStyles.metricCard, modalStyles.metricGreen]}>
                <Text style={modalStyles.metricLabel}>KYC STATUS</Text>
                <Text style={[modalStyles.metricValue, { fontSize: 11 }]}>{creator.kycStatus || creator.kycDetails?.status || 'PENDING'}</Text>
              </View>
            </ScrollView>
          </View>

          {/* Modal Tabs Row */}
          <View style={[modalStyles.modalTabsRow, isDark ? modalStyles.darkBorder : modalStyles.lightBorder]}>
            <TouchableOpacity
              onPress={() => setActiveModalTab('WEEKLY_BREAKDOWN')}
              style={[modalStyles.modalTabBtn, activeModalTab === 'WEEKLY_BREAKDOWN' && modalStyles.activeModalTabIndigo]}
            >
              <Calendar size={12} color={activeModalTab === 'WEEKLY_BREAKDOWN' ? '#818cf8' : '#71717a'} />
              <Text style={[modalStyles.modalTabText, activeModalTab === 'WEEKLY_BREAKDOWN' && modalStyles.activeModalTabTextIndigo]}>
                4-Week Audit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveModalTab('ALL_POSTS')}
              style={[modalStyles.modalTabBtn, activeModalTab === 'ALL_POSTS' && modalStyles.activeModalTabSky]}
            >
              <FileCheck size={12} color={activeModalTab === 'ALL_POSTS' ? '#38bdf8' : '#71717a'} />
              <Text style={[modalStyles.modalTabText, activeModalTab === 'ALL_POSTS' && modalStyles.activeModalTabTextSky]}>
                All Media ({posts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveModalTab('KYC_STUDIO')}
              style={[modalStyles.modalTabBtn, activeModalTab === 'KYC_STUDIO' && modalStyles.activeModalTabAmber]}
            >
              <Shield size={12} color={activeModalTab === 'KYC_STUDIO' ? '#fbbf24' : '#71717a'} />
              <Text style={[modalStyles.modalTabText, activeModalTab === 'KYC_STUDIO' && modalStyles.activeModalTabTextAmber]}>
                KYC Studio
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Body */}
          <ScrollView style={modalStyles.modalScrollBody} showsVerticalScrollIndicator={false}>
            {activeModalTab === 'WEEKLY_BREAKDOWN' && (
              <View style={modalStyles.tabContentBox}>
                {[
                  { weekNum: 1, title: 'Week 1 (Aug 1 - Aug 7)', posts: week1, count: creator.week1Count },
                  { weekNum: 2, title: 'Week 2 (Aug 8 - Aug 14)', posts: week2, count: creator.week2Count },
                  { weekNum: 3, title: 'Week 3 (Aug 15 - Aug 21)', posts: week3, count: creator.week3Count },
                  { weekNum: 4, title: 'Week 4 (Aug 22 - Aug 28)', posts: week4, count: creator.week4Count },
                ].map((w) => {
                  const isExpanded = expandedWeek === w.weekNum;
                  const countVal = w.count !== undefined ? w.count : w.posts.length;

                  return (
                    <View key={w.weekNum} style={[modalStyles.weekAccordion, isDark ? modalStyles.darkAccordion : modalStyles.lightAccordion]}>
                      <TouchableOpacity
                        onPress={() => setExpandedWeek(isExpanded ? null : w.weekNum)}
                        style={modalStyles.weekAccordionHeader}
                      >
                        <View style={modalStyles.weekTitleRow}>
                          <Calendar size={14} color="#818cf8" />
                          <Text style={[modalStyles.weekTitleText, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                            {w.title}
                          </Text>
                          <View style={[modalStyles.requirementBadge, countVal >= 3 ? modalStyles.bgPassed : modalStyles.bgPending]}>
                            <Text style={modalStyles.requirementBadgeText}>
                              {countVal} Posts {countVal >= 3 ? '✓ Requirement Met' : '(Needs 3+)'}
                            </Text>
                          </View>
                        </View>
                        {isExpanded ? <ChevronUp size={16} color="#71717a" /> : <ChevronDown size={16} color="#71717a" />}
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={modalStyles.weekAccordionBody}>
                          {w.posts.length > 0 ? (
                            w.posts.map((p: any, pIdx: number) => (
                              <View key={p.id || p._id || pIdx} style={[modalStyles.postItemRow, isDark ? modalStyles.darkSubRow : modalStyles.lightSubRow]}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[modalStyles.postCaptionText, isDark ? modalStyles.whiteText : modalStyles.blackText]} numberOfLines={2}>
                                    {p.caption || 'Media Post'}
                                  </Text>
                                  <Text style={[modalStyles.postMetaText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]}>
                                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Published'} • Category: {p.category || 'General'}
                                  </Text>
                                </View>

                                <View style={modalStyles.postStatsCol}>
                                  <Text style={modalStyles.postMetricsText}>
                                    {p.likeCount || p.likesCount || 0} L • {p.commentCount || p.commentsCount || 0} C • {p.viewCount || p.viewsCount || 0} V
                                  </Text>
                                  <Text style={modalStyles.postScoreText}>{p.score || 0} pts</Text>
                                </View>
                              </View>
                            ))
                          ) : (
                            <Text style={[modalStyles.emptyWeekText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]}>
                              No posts published during this contest week.
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {activeModalTab === 'ALL_POSTS' && (
              <View style={modalStyles.tabContentBox}>
                {posts.length === 0 ? (
                  <Text style={[modalStyles.emptyWeekText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]}>
                    No published media posts found for this creator profile.
                  </Text>
                ) : (
                  posts.map((post: any, idx: number) => (
                    <View key={post.id || post._id || idx} style={[modalStyles.postCard, isDark ? modalStyles.darkAccordion : modalStyles.lightAccordion]}>
                      {post.mediaUrl && (
                        <Image
                          source={{ uri: getMediaUrl(post.mediaUrl) }}
                          style={modalStyles.postThumbnail}
                          resizeMode="cover"
                        />
                      )}
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={modalStyles.categoryRow}>
                          <View style={modalStyles.categoryBadge}>
                            <Text style={modalStyles.categoryBadgeText}>{post.category || 'General'}</Text>
                          </View>
                          {post.createdAt && (
                            <Text style={[modalStyles.postMetaText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]}>
                              {new Date(post.createdAt).toLocaleDateString()}
                            </Text>
                          )}
                        </View>

                        <Text style={[modalStyles.postCaptionText, isDark ? modalStyles.whiteText : modalStyles.blackText]} numberOfLines={2}>
                          {post.caption || 'No caption provided.'}
                        </Text>

                        <View style={modalStyles.postEngagementRow}>
                          <View style={modalStyles.metricIconGroup}>
                            <Heart size={12} color="#f43f5e" fill="#f43f5e" />
                            <Text style={modalStyles.engagementVal}>{post.likeCount || post.likesCount || 0}</Text>
                          </View>
                          <View style={modalStyles.metricIconGroup}>
                            <MessageCircle size={12} color="#38bdf8" />
                            <Text style={modalStyles.engagementVal}>{post.commentCount || post.commentsCount || 0}</Text>
                          </View>
                          <View style={modalStyles.metricIconGroup}>
                            <Eye size={12} color="#818cf8" />
                            <Text style={modalStyles.engagementVal}>{post.viewCount || post.viewsCount || 0}</Text>
                          </View>
                          <Text style={modalStyles.postScoreBadge}>{post.score || 0} pts</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeModalTab === 'KYC_STUDIO' && (
              <View style={modalStyles.tabContentBox}>
                <View style={[modalStyles.kycStudioCard, isDark ? modalStyles.darkAccordion : modalStyles.lightAccordion]}>
                  <Text style={[modalStyles.studioTitle, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                    Submitted Identity & Aadhaar Documentation
                  </Text>

                  <View style={modalStyles.kycFieldsGrid}>
                    <View style={modalStyles.kycFieldBox}>
                      <Text style={modalStyles.kycFieldLabel}>AADHAAR NUMBER</Text>
                      <Text style={[modalStyles.kycFieldValue, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                        {kyc.aadharNumber || 'Not Provided'}
                      </Text>
                    </View>

                    <View style={modalStyles.kycFieldBox}>
                      <Text style={modalStyles.kycFieldLabel}>LINKED MOBILE</Text>
                      <Text style={[modalStyles.kycFieldValue, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                        {kyc.aadharMobile || 'Not Provided'}
                      </Text>
                    </View>

                    <View style={modalStyles.kycFieldBox}>
                      <Text style={modalStyles.kycFieldLabel}>DATE OF BIRTH</Text>
                      <Text style={[modalStyles.kycFieldValue, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                        {kyc.dob || 'Not Provided'}
                      </Text>
                    </View>
                  </View>

                  {kyc.aadharImage ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[modalStyles.kycFieldLabel, { marginBottom: 4 }]}>UPLOADED AADHAAR IMAGE</Text>
                      <Image
                        source={{ uri: getMediaUrl(kyc.aadharImage) }}
                        style={modalStyles.aadhaarFullPreview}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <Text style={modalStyles.noDocText}>No physical document image uploaded yet.</Text>
                  )}
                </View>

                {/* KYC Verdict Form */}
                <View style={[modalStyles.kycStudioCard, { borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}>
                  <Text style={[modalStyles.studioTitle, { color: '#38bdf8' }]}>
                    ADMIN KYC VERDICT & AUDIT NOTES
                  </Text>

                  <TextInput
                    style={[modalStyles.notesInput, isDark ? modalStyles.darkInput : modalStyles.lightInput, isDark ? modalStyles.whiteText : modalStyles.blackText]}
                    placeholder="Optional rejection reason or audit notes..."
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    value={kycNotes}
                    onChangeText={setKycNotes}
                  />

                  <View style={modalStyles.kycActionsRow}>
                    <TouchableOpacity
                      style={[modalStyles.verdictBtn, modalStyles.approveVerdictBtn]}
                      onPress={() => handleKycStatusUpdate('PASSED')}
                    >
                      <CheckCircle2 size={14} color="#ffffff" />
                      <Text style={modalStyles.verdictBtnText}>Approve KYC (Pass)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[modalStyles.verdictBtn, modalStyles.rejectVerdictBtn]}
                      onPress={() => handleKycStatusUpdate('FAILED')}
                    >
                      <XCircle size={14} color="#ffffff" />
                      <Text style={modalStyles.verdictBtnText}>Reject KYC (Fail)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={[modalStyles.modalFooter, isDark ? modalStyles.darkBorder : modalStyles.lightBorder]}>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeModalBtn}>
              <Text style={modalStyles.closeModalBtnText}>Close Inspector</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Subcomponent 2: AdminWinnerModalComponent
const AdminWinnerModalComponent: React.FC<{
  winner: any;
  onClose: () => void;
  onKycAction: (userId: string, status: string, notes?: string) => void;
  isDark: boolean;
}> = ({ winner, onClose, onKycAction, isDark }) => {
  if (!winner) return null;

  const post = winner.topPost || winner.post;
  const kyc = winner.kycDetails || {};
  const usernameDisplay = winner.username || winner.userEmail?.split('@')[0] || (winner.userName ? winner.userName.toLowerCase().replace(/\s+/g, '_') : 'unknown');

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.modalOverlay}>
        <View style={[modalStyles.modalCard, isDark ? modalStyles.darkCard : modalStyles.lightCard]}>
          <View style={[modalStyles.modalHeader, isDark ? modalStyles.darkBorder : modalStyles.lightBorder]}>
            <View style={{ flex: 1 }}>
              <View style={modalStyles.nameBadgeRow}>
                <Award size={16} color="#f59e0b" />
                <Text style={[modalStyles.creatorNameText, isDark ? modalStyles.whiteText : modalStyles.blackText]} numberOfLines={1}>
                  {(winner.userName || '').replace(/\s*\([^)]*\)/g, '').trim()}
                </Text>
                <TouchableOpacity onPress={() => { onClose(); router.push(`/profile/${usernameDisplay}`); }}>
                  <Text style={modalStyles.usernameText}>@{usernameDisplay}</Text>
                </TouchableOpacity>
              </View>
              <Text style={[modalStyles.emailText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]}>
                {winner.userEmail} • Prize Tier: <Text style={{ color: '#fbbf24', fontWeight: 'bold' }}>{winner.tier ? winner.tier.replace(/_/g, ' ') : 'Winner Tier'}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.modalScrollBody} showsVerticalScrollIndicator={false}>
            {/* 4 Summary Metric Cards */}
            <View style={modalStyles.metricsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modalStyles.metricsScroll}>
                <View style={[modalStyles.metricCard, modalStyles.metricSky]}>
                  <Text style={modalStyles.metricLabel}>PRIORITY RANK</Text>
                  <Text style={modalStyles.metricValue}>#{winner.priorityIndex || 1}</Text>
                </View>
                <View style={[modalStyles.metricCard, modalStyles.metricAmber]}>
                  <Text style={modalStyles.metricLabel}>SCORE</Text>
                  <Text style={modalStyles.metricValue}>{winner.score || 0} pts</Text>
                </View>
                <View style={[modalStyles.metricCard, modalStyles.metricGreen]}>
                  <Text style={modalStyles.metricLabel}>STATE</Text>
                  <Text style={[modalStyles.metricValue, { fontSize: 11 }]}>{winner.residency || 'Chhattisgarh'}</Text>
                </View>
                <View style={[modalStyles.metricCard, modalStyles.metricRose]}>
                  <Text style={modalStyles.metricLabel}>KYC STATUS</Text>
                  <Text style={[modalStyles.metricValue, { fontSize: 11 }]}>{winner.kycStatus || 'PENDING'}</Text>
                </View>
              </ScrollView>
            </View>

            {/* Submitted KYC Identification Box */}
            <View style={[modalStyles.kycStudioCard, isDark ? modalStyles.darkAccordion : modalStyles.lightAccordion]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[modalStyles.studioTitle, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                  SUBMITTED KYC DOCUMENTS
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {winner.kycStatus !== 'PASSED' && (
                    <TouchableOpacity
                      style={modalStyles.smallPassBtn}
                      onPress={() => onKycAction(winner.userId || winner.userEmail, 'PASSED')}
                    >
                      <Text style={modalStyles.verdictBtnText}>Approve KYC</Text>
                    </TouchableOpacity>
                  )}
                  {winner.kycStatus !== 'FAILED' && (
                    <TouchableOpacity
                      style={modalStyles.smallFailBtn}
                      onPress={() => onKycAction(winner.userId || winner.userEmail, 'FAILED')}
                    >
                      <Text style={modalStyles.verdictBtnText}>Reject KYC</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={modalStyles.kycFieldsGrid}>
                <View style={modalStyles.kycFieldBox}>
                  <Text style={modalStyles.kycFieldLabel}>AADHAAR NO.</Text>
                  <Text style={[modalStyles.kycFieldValue, isDark ? modalStyles.whiteText : modalStyles.blackText]}>{kyc.aadharNumber || 'N/A'}</Text>
                </View>
                <View style={modalStyles.kycFieldBox}>
                  <Text style={modalStyles.kycFieldLabel}>MOBILE</Text>
                  <Text style={[modalStyles.kycFieldValue, isDark ? modalStyles.whiteText : modalStyles.blackText]}>{kyc.aadharMobile || 'N/A'}</Text>
                </View>
                <View style={modalStyles.kycFieldBox}>
                  <Text style={modalStyles.kycFieldLabel}>DOB</Text>
                  <Text style={[modalStyles.kycFieldValue, isDark ? modalStyles.whiteText : modalStyles.blackText]}>{kyc.dob || 'N/A'}</Text>
                </View>
              </View>

              {kyc.aadharImage ? (
                <Image source={{ uri: getMediaUrl(kyc.aadharImage) }} style={modalStyles.aadhaarFullPreview} resizeMode="contain" />
              ) : (
                <Text style={modalStyles.noDocText}>No Aadhaar document uploaded.</Text>
              )}
            </View>

            {/* Winning Evaluation Post Preview */}
            <View style={[modalStyles.kycStudioCard, isDark ? modalStyles.darkAccordion : modalStyles.lightAccordion, { marginTop: 10 }]}>
              <Text style={[modalStyles.studioTitle, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                TOP EVALUATION POST PREVIEW
              </Text>
              {post ? (
                <View style={{ gap: 6 }}>
                  {post.mediaUrl && (
                    <Image source={{ uri: getMediaUrl(post.mediaUrl) }} style={modalStyles.postThumbnailFull} resizeMode="cover" />
                  )}
                  <Text style={[modalStyles.postCaptionText, isDark ? modalStyles.whiteText : modalStyles.blackText]}>
                    {post.caption || 'No caption provided.'}
                  </Text>
                  <View style={modalStyles.postEngagementRow}>
                    <Text style={[modalStyles.postMetaText, isDark ? modalStyles.mutedDark : modalStyles.mutedLight]}>
                      ♥ {post.likesCount || post.likeCount || 0} • 💬 {post.commentsCount || post.commentCount || 0} • 👁 {post.viewsCount || post.viewCount || 0}
                    </Text>
                    <Text style={modalStyles.postScoreBadge}>{post.score || 0} pts</Text>
                  </View>
                </View>
              ) : (
                <Text style={modalStyles.noDocText}>No top post attached to this prize tier.</Text>
              )}
            </View>
          </ScrollView>

          <View style={[modalStyles.modalFooter, isDark ? modalStyles.darkBorder : modalStyles.lightBorder]}>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeModalBtn}>
              <Text style={modalStyles.closeModalBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const AdminComponents: React.FC = () => {
  const { isDark } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'WINNERS' | 'PARTICIPANTS' | 'WEEKLY' | 'LOGS'>('WINNERS');
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [kycAuditLogs, setKycAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Filters for Creator Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [residencyFilter, setResidencyFilter] = useState('ALL');
  const [kycFilter, setKycFilter] = useState('ALL');

  // Search for Weekly Activity
  const [weeklySearch, setWeeklySearch] = useState('');

  // Tier Filter for 33 Prize Cascade Table
  const [tierFilter, setTierFilter] = useState('ALL');

  // Inspector Modal States
  const [selectedCreator, setSelectedCreator] = useState<any | null>(null);
  const [inspectWinner, setInspectWinner] = useState<any | null>(null);

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const fetchAllAdminData = async () => {
    try {
      setLoading(true);
      const [winRes, statRes, partRes] = await Promise.all([
        adminApi.get('/admin/winners'),
        adminApi.get('/admin/stats'),
        adminApi.get('/admin/participants/paginated'),
      ]);

      const winData = winRes.data.data || {};
      const statData = statRes.data.data || {};
      const partData = partRes.data.data || {};

      setWinners(winData.winners || []);
      setSummary(winData.summary || null);
      setWeeklyActivity(winData.weeklyActivity || []);
      setKycAuditLogs(winData.kycAuditLogs || []);

      setStats(statData);
      setParticipants(partData.users || partData.participants || []);

      setSyncNotice('All contest prize allocations & 10M metrics synced successfully!');
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to re-compute admin data', err);
      toast.error(err.response?.data?.message || 'Failed to sync admin data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleKycStatusChange = async (userId: string, newStatus: string, notes?: string) => {
    try {
      await adminApi.put(`/admin/kyc/${userId}`, {
        status: newStatus,
        notes: notes || `KYC updated to ${newStatus} from Command Center`,
      });
      toast.success(`KYC status updated to ${newStatus}`, 'Success');
      if (selectedCreator && (selectedCreator.id === userId || selectedCreator.userId === userId)) {
        setSelectedCreator((prev: any) => ({ ...prev, kycStatus: newStatus }));
      }
      if (inspectWinner && (inspectWinner.userId === userId || inspectWinner.userEmail === userId)) {
        setInspectWinner((prev: any) => ({ ...prev, kycStatus: newStatus }));
      }
      fetchAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update KYC status', 'Error');
    }
  };

  const filteredWinners = winners.filter((w) => {
    if (tierFilter === 'GRAND') return w.tier === 'GRAND_CHAMPION' || w.tier === 'GRAND_PRIZE';
    if (tierFilter === 'BUMPER') return w.tier?.startsWith('BUMPER') || w.tier?.startsWith('TOP_PERFORMER');
    if (tierFilter === 'WEEKLY') return w.tier?.startsWith('WEEKLY') || w.tier?.startsWith('CATEGORY');
    if (tierFilter === 'CONSISTENCY') return w.tier?.startsWith('CONSISTENCY');
    return true;
  });

  const filteredParticipants = participants.filter((p) => {
    const username = p.username || (p.email ? p.email.split('@')[0] : '');
    const matchesSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id || p.userId)?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesResidency =
      residencyFilter === 'ALL' ||
      (residencyFilter === 'Chhattisgarh'
        ? p.residency === 'Chhattisgarh'
        : p.residency !== 'Chhattisgarh');

    const kycStatus = p.kycStatus || p.kycDetails?.status || 'NOT_SUBMITTED';
    const matchesKyc = kycFilter === 'ALL' || kycStatus === kycFilter;

    return matchesSearch && matchesResidency && matchesKyc;
  });

  const filteredWeekly = weeklyActivity.filter((item) => {
    if (!weeklySearch) return true;
    const q = weeklySearch.toLowerCase();
    return (
      item.userName?.toLowerCase().includes(q) ||
      item.userEmail?.toLowerCase().includes(q) ||
      item.username?.toLowerCase().includes(q)
    );
  });

  const totalUsersDisplay = (stats.totalUsers || summary?.totalEligibleUsers || participants.length || 0).toLocaleString();
  const cgEligibleDisplay = (stats.totalCgEligible || summary?.totalEligibleUsers || 0).toLocaleString();
  const pendingKycDisplay = (stats.kycPending || 0).toLocaleString();
  const prizesAwardedDisplay = summary?.prizesAwarded || winners.length || 0;
  const totalPostsDisplay = (stats.totalPosts || summary?.totalEligiblePosts || 0).toLocaleString();

  return (
    <View style={styles.container}>
      {/* Header & Live Engine Badge */}
      <View style={[styles.headerRow, isDark ? styles.darkBorder : styles.lightBorder]}>
        <View style={styles.headerTitleBox}>
          <View style={styles.trophyIconBox}>
            <Trophy size={18} color="#f59e0b" />
          </View>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={[styles.adminTitle, isDark ? styles.whiteText : styles.blackText]}>
                Contestify Admin Center
              </Text>
              <View style={styles.engineBadge}>
                <Server size={10} color="#818cf8" />
                <Text style={styles.engineBadgeText}>10M Engine</Text>
              </View>
            </View>
            <Text style={[styles.adminSub, isDark ? styles.mutedDark : styles.mutedLight]}>
              Real-Time 33-Prize Priority Allocation Cascade • Indexed Server Queries
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={fetchAllAdminData}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <RefreshCw size={13} color="#ffffff" />
              <Text style={styles.syncBtnText}>Re-compute & Sync</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sync Notice Banner */}
      {syncNotice && (
        <View style={styles.noticeBanner}>
          <CheckCircle2 size={14} color="#34d399" />
          <Text style={styles.noticeText}>{syncNotice}</Text>
        </View>
      )}

      {/* 5 Analytics KPI Cards Horizontal Scroll */}
      <View style={styles.kpiWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiScroll}
        >
          {/* Card 1: Total Registered */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiBlue]}
            onPress={() => {
              setActiveTab('PARTICIPANTS');
              setResidencyFilter('ALL');
            }}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Registered</Text>
              <Users size={14} color="#38bdf8" />
            </View>
            <Text style={styles.kpiValue}>{totalUsersDisplay}</Text>
            <Text style={styles.kpiSub}>Mongo & Postgres</Text>
          </TouchableOpacity>

          {/* Card 2: CG Eligible */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiGreen]}
            onPress={() => {
              setActiveTab('PARTICIPANTS');
              setResidencyFilter('Chhattisgarh');
            }}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>CG Eligible</Text>
              <CheckCircle2 size={14} color="#34d399" />
            </View>
            <Text style={styles.kpiValue}>{cgEligibleDisplay}</Text>
            <Text style={styles.kpiSub}>Verified Rule</Text>
          </TouchableOpacity>

          {/* Card 3: Pending KYC */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiAmber]}
            onPress={() => {
              setActiveTab('PARTICIPANTS');
              setKycFilter('PENDING');
            }}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Pending KYC</Text>
              <FileCheck size={14} color="#fbbf24" />
            </View>
            <Text style={styles.kpiValue}>{pendingKycDisplay}</Text>
            <Text style={styles.kpiSub}>Review Queue →</Text>
          </TouchableOpacity>

          {/* Card 4: Prizes Allocated */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiPurple]}
            onPress={() => setActiveTab('WINNERS')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Prizes Allocated</Text>
              <Award size={14} color="#c084fc" />
            </View>
            <Text style={styles.kpiValue}>{prizesAwardedDisplay} / 33</Text>
            <Text style={styles.kpiSub}>Priority Hierarchy</Text>
          </TouchableOpacity>

          {/* Card 5: Media Posts Evaluated */}
          <View style={[styles.kpiCard, styles.kpiIndigo]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Posts Evaluated</Text>
              <Activity size={14} color="#818cf8" />
            </View>
            <Text style={styles.kpiValue}>{totalPostsDisplay}</Text>
            <Text style={styles.kpiSub}>Likes+Comments+Views</Text>
          </View>
        </ScrollView>
      </View>

      {/* 4 Navigation Tabs Bar */}
      <View style={[styles.tabsRow, isDark ? styles.darkBorder : styles.lightBorder]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'WINNERS' && styles.activeTabBtnWinners]}
          onPress={() => setActiveTab('WINNERS')}
        >
          <Trophy size={13} color="#f59e0b" />
          <Text style={[styles.tabText, activeTab === 'WINNERS' && styles.activeTabTextWinners]}>
            🏆 33 Prize Cascade ({winners.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PARTICIPANTS' && styles.activeTabBtnParticipants]}
          onPress={() => setActiveTab('PARTICIPANTS')}
        >
          <Users size={13} color="#38bdf8" />
          <Text style={[styles.tabText, activeTab === 'PARTICIPANTS' && styles.activeTabTextParticipants]}>
            👥 Creator Directory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'WEEKLY' && styles.activeTabBtnWeekly]}
          onPress={() => setActiveTab('WEEKLY')}
        >
          <Calendar size={13} color="#818cf8" />
          <Text style={[styles.tabText, activeTab === 'WEEKLY' && styles.activeTabTextWeekly]}>
            📅 Weekly Activity ({weeklyActivity.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'LOGS' && styles.activeTabBtnLogs]}
          onPress={() => setActiveTab('LOGS')}
        >
          <Shield size={13} color="#34d399" />
          <Text style={[styles.tabText, activeTab === 'LOGS' && styles.activeTabTextLogs]}>
            🛡️ KYC Audit ({kycAuditLogs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content Display */}
      <View style={styles.tabContentContainer}>
        {/* TAB 1: 33 Prize Cascade Table */}
        {activeTab === 'WINNERS' && (
          <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
            {/* Overview Stats Mini Cards (Matches AdminTable.jsx) */}
            <View style={styles.miniStatsRow}>
              <View style={[styles.miniCard, styles.miniCardBlue]}>
                <Text style={styles.miniCardLabel}>Eligible Users</Text>
                <Text style={styles.miniCardValue}>{summary?.totalEligibleUsers || 0}</Text>
                <Text style={styles.miniCardSub}>Chhattisgarh Residents Only</Text>
              </View>
              <View style={[styles.miniCard, styles.miniCardPurple]}>
                <Text style={styles.miniCardLabel}>Contest Posts</Text>
                <Text style={styles.miniCardValue}>{summary?.totalEligiblePosts || 0}</Text>
                <Text style={styles.miniCardSub}>Evaluated in Ranking Engine</Text>
              </View>
              <View style={[styles.miniCard, styles.miniCardAmber]}>
                <Text style={styles.miniCardLabel}>Prizes Allocated</Text>
                <Text style={styles.miniCardValue}>{summary?.prizesAwarded || 0} / 33</Text>
                <Text style={styles.miniCardSub}>Strict Priority Hierarchy</Text>
              </View>
              <View style={[styles.miniCard, styles.miniCardRose]}>
                <Text style={styles.miniCardLabel}>Disqualified / Failed KYC</Text>
                <Text style={styles.miniCardValue}>{summary?.disqualifiedCount || 0}</Text>
                <Text style={styles.miniCardSub}>Cascaded Down to Next Person</Text>
              </View>
            </View>

            {/* Prize Tier Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
              {[
                { id: 'ALL', label: 'All Tiers (33 Prizes)' },
                { id: 'GRAND', label: 'Grand Champion' },
                { id: 'BUMPER', label: 'Top Performers' },
                { id: 'WEEKLY', label: 'Category Champions' },
                { id: 'CONSISTENCY', label: 'Consistency Bonuses' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.filterPill, tierFilter === t.id && styles.activeFilterPill]}
                  onPress={() => setTierFilter(t.id)}
                >
                  <Text style={[styles.filterPillText, tierFilter === t.id && styles.activeFilterPillText]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredWinners.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Trophy size={32} color={isDark ? '#3f3f46' : '#d4d4d8'} />
                <Text style={[styles.emptyText, isDark ? styles.mutedDark : styles.mutedLight]}>
                  No winner allocation calculated yet matching filter. Click Re-compute to run engine.
                </Text>
              </View>
            ) : (
              filteredWinners.map((w, idx) => {
                const isUnawarded = w.userId === 'UNAWARDED';
                const isFailed = w.kycStatus === 'FAILED';
                const isPassed = w.kycStatus === 'PASSED';
                const usernameDisplay =
                  w.username ||
                  (w.userEmail ? w.userEmail.split('@')[0] : '') ||
                  (w.userName ? w.userName.toLowerCase().replace(/\s+/g, '_') : 'unknown');
                const tierDisplay = w.tier ? w.tier.replace(/_/g, ' ') : 'PRIZE TIER';
                const formattedName = (w.userName || '').replace(/\s*\([^)]*\)/g, '').trim();

                return (
                  <View
                    key={`${w.tier}_${w.tierCategory || idx}`}
                    style={[
                      styles.tableRow,
                      isDark ? styles.darkRow : styles.lightRow,
                      isFailed && styles.failedRowBg,
                      isPassed && styles.passedRowBg,
                    ]}
                  >
                    {/* Top Bar: Priority #, Tier Name, KYC Status Badge */}
                    <View style={styles.rowTopHeader}>
                      <View style={styles.tierPillRow}>
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityText}>#{w.priorityIndex || idx + 1}</Text>
                        </View>
                        <Text style={[styles.tierNameText, isDark ? styles.whiteText : styles.blackText]} numberOfLines={1}>
                          {tierDisplay}
                        </Text>
                      </View>

                      {isUnawarded ? (
                        <View style={styles.naBadge}>
                          <Text style={styles.naBadgeText}>N/A</Text>
                        </View>
                      ) : isPassed ? (
                        <View style={styles.bgPassed}>
                          <Text style={styles.kycStatusText}>✓ PASSED</Text>
                        </View>
                      ) : isFailed ? (
                        <View style={styles.bgFailed}>
                          <Text style={styles.kycStatusText}>✕ FAILED</Text>
                        </View>
                      ) : (
                        <View style={styles.bgPending}>
                          <Text style={styles.kycStatusText}>! PENDING</Text>
                        </View>
                      )}
                    </View>

                    {/* Winner Profile & Details (if !isUnawarded) */}
                    {!isUnawarded && (
                      <View style={styles.winnerDetailsBox}>
                        <View style={styles.winnerLeftCol}>
                          <TouchableOpacity
                            onPress={() => router.push(`/profile/${usernameDisplay}`)}
                            style={styles.nameLinkRow}
                          >
                            <Text style={styles.winnerUsernameText}>@{usernameDisplay}</Text>
                            <ExternalLink size={11} color="#38bdf8" />
                          </TouchableOpacity>
                          {!!formattedName && (
                            <Text style={[styles.winnerNameSubText, isDark ? styles.mutedDark : styles.mutedLight]}>
                              {formattedName}
                            </Text>
                          )}
                          {!!w.userEmail && (
                            <Text style={[styles.winnerEmailText, isDark ? styles.mutedDark : styles.mutedLight]}>
                              {w.userEmail}
                            </Text>
                          )}
                        </View>

                        <View style={styles.winnerRightCol}>
                          <Text style={styles.scoreLabel}>SCORE</Text>
                          <Text style={styles.scoreValue}>{w.score || 0} pts</Text>
                        </View>
                      </View>
                    )}

                    {/* Actions Bar (Inspect Post, Pass KYC, Fail KYC) */}
                    {!isUnawarded && (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.inspectBtn}
                          onPress={() => setInspectWinner(w)}
                        >
                          <Eye size={11} color="#818cf8" />
                          <Text style={styles.inspectBtnText}>Inspect Post</Text>
                        </TouchableOpacity>

                        {w.kycStatus !== 'PASSED' && (
                          <TouchableOpacity
                            style={styles.passKycBtn}
                            onPress={() => handleKycStatusChange(w.userId, 'PASSED')}
                          >
                            <Text style={styles.actionBtnText}>Pass KYC</Text>
                          </TouchableOpacity>
                        )}

                        {w.kycStatus !== 'FAILED' && (
                          <TouchableOpacity
                            style={styles.failKycBtn}
                            onPress={() => handleKycStatusChange(w.userId, 'FAILED')}
                          >
                            <Text style={styles.actionBtnText}>Fail KYC</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* TAB 2: Creator Directory */}
        {activeTab === 'PARTICIPANTS' && (
          <View style={styles.dirContainer}>
            {/* Search Input */}
            <View style={[styles.searchBox, isDark ? styles.darkInput : styles.lightInput]}>
              <Search size={15} color={isDark ? '#a1a1aa' : '#71717a'} />
              <TextInput
                style={[styles.searchInput, isDark ? styles.whiteText : styles.blackText]}
                placeholder="Search name, email, @username or User ID..."
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Residency Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
              {['ALL', 'Chhattisgarh', 'Outside CG'].map((res) => (
                <TouchableOpacity
                  key={res}
                  style={[styles.filterPill, residencyFilter === res && styles.activeFilterPill]}
                  onPress={() => setResidencyFilter(res)}
                >
                  <Text style={[styles.filterPillText, residencyFilter === res && styles.activeFilterPillText]}>
                    Residency: {res}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* KYC Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
              {['ALL', 'PENDING', 'PASSED', 'FAILED', 'NOT_SUBMITTED'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterPill, kycFilter === status && styles.activeFilterPill]}
                  onPress={() => setKycFilter(status)}
                >
                  <Text style={[styles.filterPillText, kycFilter === status && styles.activeFilterPillText]}>
                    KYC: {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
              {filteredParticipants.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={32} color={isDark ? '#3f3f46' : '#d4d4d8'} />
                  <Text style={[styles.emptyText, isDark ? styles.mutedDark : styles.mutedLight]}>
                    No creators found matching directory filters.
                  </Text>
                </View>
              ) : (
                filteredParticipants.map((p) => {
                  const uid = p.id || p._id || p.userId;
                  const kycStatus = p.kycStatus || p.kycDetails?.status || 'NOT_SUBMITTED';
                  const username = p.username || (p.email ? p.email.split('@')[0] : 'creator');
                  const isCG = p.residency === 'Chhattisgarh';

                  return (
                    <TouchableOpacity
                      key={uid}
                      style={[styles.tableRow, isDark ? styles.darkRow : styles.lightRow]}
                      onPress={() => setSelectedCreator(p)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.rowTopHeader}>
                        <View style={styles.nameLinkRow}>
                          <View style={styles.miniAvatar}>
                            <Text style={styles.miniAvatarText}>{(p.name || username)[0].toUpperCase()}</Text>
                          </View>
                          <TouchableOpacity onPress={() => router.push(`/profile/${username}`)}>
                            <Text style={[styles.winnerName, isDark ? styles.whiteText : styles.blackText]}>
                              @{username}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={[
                          styles.kycStatusBadge,
                          kycStatus === 'PASSED' && styles.bgPassed,
                          kycStatus === 'FAILED' && styles.bgFailed,
                          kycStatus === 'PENDING' && styles.bgPending,
                        ]}>
                          <Text style={styles.kycStatusText}>KYC: {kycStatus}</Text>
                        </View>
                      </View>

                      <View style={styles.winnerDetailsBox}>
                        <View style={styles.winnerLeftCol}>
                          <Text style={[styles.winnerNameSubText, isDark ? styles.whiteText : styles.blackText]}>
                            {(p.name || p.userName || '').replace(/\s*\([^)]*\)/g, '').trim()}
                          </Text>
                          <Text style={[styles.winnerEmailText, isDark ? styles.mutedDark : styles.mutedLight]}>
                            {p.email} • {isCG ? 'CG Resident (Eligible)' : (p.residency || 'Outside CG')}
                          </Text>
                        </View>

                        <View style={styles.winnerRightCol}>
                          <Text style={styles.scoreLabel}>MAX SCORE</Text>
                          <Text style={styles.scoreValue}>{p.maxScore || p.score || 0} pts</Text>
                        </View>
                      </View>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.inspectBtn}
                          onPress={() => setSelectedCreator(p)}
                        >
                          <Eye size={11} color="#38bdf8" />
                          <Text style={[styles.inspectBtnText, { color: '#38bdf8' }]}>Inspect Details</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {/* TAB 3: Weekly Activity Audit Matrix */}
        {activeTab === 'WEEKLY' && (
          <View style={styles.dirContainer}>
            <View style={[styles.searchBox, isDark ? styles.darkInput : styles.lightInput]}>
              <Search size={15} color={isDark ? '#a1a1aa' : '#71717a'} />
              <TextInput
                style={[styles.searchInput, isDark ? styles.whiteText : styles.blackText]}
                placeholder="Search creator name or email in weekly matrix..."
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                value={weeklySearch}
                onChangeText={setWeeklySearch}
              />
            </View>

            <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
              {filteredWeekly.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Calendar size={32} color={isDark ? '#3f3f46' : '#d4d4d8'} />
                  <Text style={[styles.emptyText, isDark ? styles.mutedDark : styles.mutedLight]}>
                    No weekly posting activity found matching search criteria.
                  </Text>
                </View>
              ) : (
                filteredWeekly.map((userItem) => {
                  const isConsistent = userItem.isConsistencyEligible;
                  const w1 = userItem.week1Count || 0;
                  const w2 = userItem.week2Count || 0;
                  const w3 = userItem.week3Count || 0;
                  const w4 = userItem.week4Count || 0;
                  const username = userItem.username || (userItem.userEmail ? userItem.userEmail.split('@')[0] : 'creator');
                  const formattedName = (userItem.userName || '').replace(/\s*\([^)]*\)/g, '').trim();

                  return (
                    <TouchableOpacity
                      key={userItem.userId}
                      style={[styles.tableRow, isDark ? styles.darkRow : styles.lightRow]}
                      onPress={() => setSelectedCreator(userItem)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.rowTopHeader}>
                        <View style={styles.nameLinkRow}>
                          <TouchableOpacity onPress={() => router.push(`/profile/${username}`)}>
                            <Text style={styles.winnerUsernameText}>@{username}</Text>
                          </TouchableOpacity>
                          {!!formattedName && (
                            <Text style={[styles.winnerNameSubText, isDark ? styles.mutedDark : styles.mutedLight]}>
                              ({formattedName})
                            </Text>
                          )}
                        </View>

                        {isConsistent ? (
                          <View style={styles.eligibleBadge}>
                            <CheckCircle2 size={11} color="#34d399" />
                            <Text style={styles.eligibleText}>Eligible (3+/wk)</Text>
                          </View>
                        ) : (
                          <View style={styles.ineligibleBadge}>
                            <XCircle size={11} color="#f43f5e" />
                            <Text style={styles.ineligibleText}>Ineligible (&lt;3/wk)</Text>
                          </View>
                        )}
                      </View>

                      {/* 4 Weeks Post Badges */}
                      <View style={styles.weeklyMatrixGrid}>
                        <View style={[styles.weekGridCell, isDark ? styles.darkGridCell : styles.lightGridCell]}>
                          <Text style={styles.weekGridTitle}>W1</Text>
                          <Text style={[styles.weekGridVal, w1 >= 3 ? styles.textGreen : styles.textAmber]}>
                            {w1} {w1 === 1 ? 'post' : 'posts'}
                          </Text>
                          <Text style={styles.weekGridSub}>Max: {userItem.week1MaxScore || 0} pts</Text>
                        </View>

                        <View style={[styles.weekGridCell, isDark ? styles.darkGridCell : styles.lightGridCell]}>
                          <Text style={styles.weekGridTitle}>W2</Text>
                          <Text style={[styles.weekGridVal, w2 >= 3 ? styles.textGreen : styles.textAmber]}>
                            {w2} {w2 === 1 ? 'post' : 'posts'}
                          </Text>
                          <Text style={styles.weekGridSub}>Max: {userItem.week2MaxScore || 0} pts</Text>
                        </View>

                        <View style={[styles.weekGridCell, isDark ? styles.darkGridCell : styles.lightGridCell]}>
                          <Text style={styles.weekGridTitle}>W3</Text>
                          <Text style={[styles.weekGridVal, w3 >= 3 ? styles.textGreen : styles.textAmber]}>
                            {w3} {w3 === 1 ? 'post' : 'posts'}
                          </Text>
                          <Text style={styles.weekGridSub}>Max: {userItem.week3MaxScore || 0} pts</Text>
                        </View>

                        <View style={[styles.weekGridCell, isDark ? styles.darkGridCell : styles.lightGridCell]}>
                          <Text style={styles.weekGridTitle}>W4</Text>
                          <Text style={[styles.weekGridVal, w4 >= 3 ? styles.textGreen : styles.textAmber]}>
                            {w4} {w4 === 1 ? 'post' : 'posts'}
                          </Text>
                          <Text style={styles.weekGridSub}>Max: {userItem.week4MaxScore || 0} pts</Text>
                        </View>
                      </View>

                      {/* Footer Row */}
                      <View style={styles.weeklyFooterRow}>
                        <Text style={[styles.totalPostsText, isDark ? styles.whiteText : styles.blackText]}>
                          Total: {userItem.totalPosts || (w1 + w2 + w3 + w4)} posts • <Text style={styles.scoreValue}>{userItem.consistencyScore || 0} pts</Text>
                        </Text>

                        <TouchableOpacity
                          style={styles.inspectBtn}
                          onPress={() => setSelectedCreator(userItem)}
                        >
                          <Eye size={11} color="#818cf8" />
                          <Text style={styles.inspectBtnText}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {/* TAB 4: KYC Audit Logs */}
        {activeTab === 'LOGS' && (
          <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
            {kycAuditLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Shield size={32} color={isDark ? '#3f3f46' : '#d4d4d8'} />
                <Text style={[styles.emptyText, isDark ? styles.mutedDark : styles.mutedLight]}>
                  No KYC audit log records generated yet.
                </Text>
              </View>
            ) : (
              kycAuditLogs.map((log, idx) => {
                const isPass = log.newStatus === 'PASSED';
                const isFail = log.newStatus === 'FAILED';

                return (
                  <View
                    key={log.id || log._id || idx}
                    style={[styles.tableRow, isDark ? styles.darkRow : styles.lightRow]}
                  >
                    <View style={styles.rowMain}>
                      <View style={styles.rowTopHeader}>
                        <Text style={[styles.winnerName, isDark ? styles.whiteText : styles.blackText]}>
                          {log.userEmail || log.userId}
                        </Text>
                        {isPass ? (
                          <View style={styles.bgPassed}>
                            <Text style={styles.kycStatusText}>PASSED</Text>
                          </View>
                        ) : isFail ? (
                          <View style={styles.bgFailed}>
                            <Text style={styles.kycStatusText}>FAILED</Text>
                          </View>
                        ) : (
                          <View style={styles.bgPending}>
                            <Text style={styles.kycStatusText}>{log.newStatus}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.winnerDetailsBox}>
                        <Text style={[styles.subText, isDark ? styles.mutedDark : styles.mutedLight]}>
                          Prev: {log.previousStatus || 'PENDING'} • Admin: {log.adminEmail || 'System'}
                        </Text>
                        <Text style={[styles.subText, isDark ? styles.mutedDark : styles.mutedLight]}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                        </Text>
                      </View>

                      {log.notes && (
                        <Text style={styles.auditNotes}>"{log.notes}"</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Creator Inspector Modal (4-Week Post Audit, All Media, KYC Studio) */}
      {selectedCreator && (
        <AdminCreatorDetailsModal
          creator={selectedCreator}
          onClose={() => setSelectedCreator(null)}
          onKycUpdate={handleKycStatusChange}
          isDark={isDark}
        />
      )}

      {/* Winner Post Preview & Inspection Modal */}
      {inspectWinner && (
        <AdminWinnerModalComponent
          winner={inspectWinner}
          onClose={() => setInspectWinner(null)}
          onKycAction={handleKycStatusChange}
          isDark={isDark}
        />
      )}
    </View>
  );
};

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  darkCard: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
  },
  lightCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  darkBorder: {
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderBottomColor: '#e4e4e7',
  },
  creatorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#818cf8',
    fontWeight: '900',
    fontSize: 14,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  creatorNameText: {
    fontSize: 14,
    fontWeight: '900',
  },
  usernameLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  usernameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  emailSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  emailText: {
    fontSize: 10,
  },
  cgBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  cgBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
  },
  nonCgBadge: {
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
    borderColor: 'rgba(113, 113, 122, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  nonCgBadgeText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
  },
  metricsRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(113, 113, 122, 0.15)',
  },
  metricsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  metricCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 85,
  },
  metricBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  metricRose: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  metricSky: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  metricIndigo: {
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
    borderColor: 'rgba(129, 140, 248, 0.25)',
  },
  metricAmber: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  metricGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  modalTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  modalTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeModalTabIndigo: {
    borderBottomColor: '#818cf8',
  },
  activeModalTabSky: {
    borderBottomColor: '#38bdf8',
  },
  activeModalTabAmber: {
    borderBottomColor: '#fbbf24',
  },
  modalTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#71717a',
  },
  activeModalTabTextIndigo: {
    color: '#818cf8',
  },
  activeModalTabTextSky: {
    color: '#38bdf8',
  },
  activeModalTabTextAmber: {
    color: '#fbbf24',
  },
  modalScrollBody: {
    flex: 1,
    padding: 14,
  },
  tabContentBox: {
    gap: 10,
  },
  weekAccordion: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  darkAccordion: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  lightAccordion: {
    backgroundColor: '#f4f4f5',
    borderColor: '#e4e4e7',
  },
  weekAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  weekTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requirementBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bgPassed: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bgPending: {
    backgroundColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bgFailed: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  weekAccordionBody: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(113, 113, 122, 0.15)',
    gap: 8,
  },
  postItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  darkSubRow: {
    backgroundColor: '#27272a',
  },
  lightSubRow: {
    backgroundColor: '#e4e4e7',
  },
  postCaptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  postMetaText: {
    fontSize: 10,
    marginTop: 2,
  },
  postStatsCol: {
    alignItems: 'flex-end',
  },
  postMetricsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38bdf8',
  },
  postScoreText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    marginTop: 2,
  },
  emptyWeekText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  postCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  postThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  postThumbnailFull: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  postEngagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  engagementVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  postScoreBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
  },
  kycStudioCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
  },
  studioTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  kycFieldsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  kycFieldBox: {
    flex: 1,
  },
  kycFieldLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  kycFieldValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 1,
  },
  aadhaarFullPreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: '#000000',
  },
  noDocText: {
    fontSize: 11,
    color: '#ef4444',
    textAlign: 'center',
    padding: 8,
  },
  notesInput: {
    fontSize: 11,
    padding: 8,
    borderRadius: 10,
  },
  kycActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  verdictBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  approveVerdictBtn: {
    backgroundColor: '#059669',
  },
  rejectVerdictBtn: {
    backgroundColor: '#dc2626',
  },
  verdictBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smallPassBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smallFailBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  closeModalBtn: {
    backgroundColor: 'rgba(113, 113, 122, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  closeModalBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
  mutedDark: {
    color: '#a1a1aa',
  },
  mutedLight: {
    color: '#71717a',
  },
  darkInput: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lightInput: {
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  darkBorder: {
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderBottomColor: '#e4e4e7',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  trophyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  engineBadgeText: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  adminSub: {
    fontSize: 10,
    marginTop: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    padding: 8,
    borderRadius: 10,
  },
  noticeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  kpiWrapper: {
    height: 75,
  },
  kpiScroll: {
    gap: 8,
  },
  kpiCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 115,
    justifyContent: 'center',
  },
  kpiBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  kpiGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  kpiAmber: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  kpiPurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  kpiIndigo: {
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 8,
    color: '#71717a',
    marginTop: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(113, 113, 122, 0.1)',
  },
  activeTabBtnWinners: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  activeTabBtnParticipants: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  activeTabBtnWeekly: {
    backgroundColor: 'rgba(129, 140, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  activeTabBtnLogs: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  activeTabTextWinners: {
    color: '#fbbf24',
  },
  activeTabTextParticipants: {
    color: '#38bdf8',
  },
  activeTabTextWeekly: {
    color: '#818cf8',
  },
  activeTabTextLogs: {
    color: '#34d399',
  },
  tabContentContainer: {
    flex: 1,
  },
  tableScroll: {
    flex: 1,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  miniCard: {
    flex: 1,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  miniCardBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  miniCardPurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderColor: 'rgba(192, 132, 252, 0.2)',
  },
  miniCardAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  miniCardRose: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  miniCardLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  miniCardValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 1,
  },
  miniCardSub: {
    fontSize: 7,
    color: '#71717a',
  },
  tableRow: {
    flexDirection: 'column',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 6,
  },
  darkRow: {
    backgroundColor: '#18181b',
  },
  lightRow: {
    backgroundColor: '#f4f4f5',
  },
  failedRowBg: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  passedRowBg: {
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  rowTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tierPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  priorityText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
  },
  tierNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  naBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(113, 113, 122, 0.2)',
  },
  naBadgeText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  winnerDetailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(113, 113, 122, 0.15)',
  },
  winnerLeftCol: {
    flex: 1,
  },
  winnerUsernameText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38bdf8',
  },
  winnerNameSubText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  winnerEmailText: {
    fontSize: 10,
    marginTop: 1,
  },
  winnerRightCol: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#71717a',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(113, 113, 122, 0.15)',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  inspectBtnText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  passKycBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  failKycBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dirContainer: {
    flex: 1,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
  },
  darkInput: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lightInput: {
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    height: 26,
  },
  filterPillRow: {
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(113, 113, 122, 0.1)',
  },
  activeFilterPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  activeFilterPillText: {
    color: '#38bdf8',
  },
  nameLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  winnerName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  kycStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kycStatusText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  eligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  eligibleText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
  },
  ineligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ineligibleText: {
    color: '#f43f5e',
    fontSize: 9,
    fontWeight: 'bold',
  },
  weeklyMatrixGrid: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  weekGridCell: {
    flex: 1,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  darkGridCell: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  lightGridCell: {
    backgroundColor: '#e4e4e7',
    borderColor: '#d4d4d8',
  },
  weekGridTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  weekGridVal: {
    fontSize: 10,
    fontWeight: '900',
    marginVertical: 1,
  },
  weekGridSub: {
    fontSize: 7,
    color: '#71717a',
  },
  textGreen: {
    color: '#34d399',
  },
  textAmber: {
    color: '#fbbf24',
  },
  weeklyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(113, 113, 122, 0.15)',
  },
  totalPostsText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  auditNotes: {
    fontSize: 10,
    color: '#38bdf8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    textAlign: 'center',
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
  mutedDark: {
    color: '#a1a1aa',
  },
  mutedLight: {
    color: '#71717a',
  },
  subText: {
    fontSize: 10,
  },
  bgPassed: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bgPending: {
    backgroundColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bgFailed: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rowMain: {
    flex: 1,
  },
});
