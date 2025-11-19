import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { SOWData, SOWPdfExportProps } from './types';
import {
  formatCurrency,
  calculateScopeTotal,
  calculateScopeHours,
  calculateGrandTotal,
  calculateTotalHours,
} from './utils';

// Register fonts
Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans@5.0.8/files/plus-jakarta-sans-latin-400-normal.woff' },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans@5.0.8/files/plus-jakarta-sans-latin-700-normal.woff', fontWeight: 'bold' },
  ],
});

const palette = {
  primary: '#00A86B',
  primaryDark: '#008456',
  primaryLight: '#E9F7F0',
  text: '#1E2A2F',
  textMuted: '#516066',
  border: '#D2E2DA',
  tableStripe: '#F7FBF9',
  deliverableBg: '#F0F7FF',
  assumptionBg: '#FFF6E6',
};

// Define styles using StyleSheet
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Plus Jakarta Sans', // Sam's requirement: Use Plus Jakarta Sans font
    backgroundColor: '#FFFFFF',
    color: palette.text,
  },

  // Header Section Styles
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 40,
    marginBottom: 12,
  },
  brandNameRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'baseline',
  },
  brandNamePrimary: {
    fontSize: 20,
    letterSpacing: 4,
    color: '#596063',
    marginRight: 4,
  },
  brandNameAccent: {
    fontSize: 20,
    letterSpacing: 4,
    color: palette.primary,
  },
  banner: {
    backgroundColor: palette.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: palette.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  clientInfo: {
    fontSize: 11,
    textAlign: 'center',
    color: palette.textMuted,
  },
  clientLabel: {
    fontWeight: 'bold',
    color: palette.text,
  },

  // Scope Section Styles
  scopeSection: {
    marginBottom: 28,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  scopeHeader: {
    backgroundColor: palette.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  scopeHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scopeBody: {
    padding: 16,
  },
  scopeDescription: {
    fontSize: 9.5,
    marginBottom: 16,
    lineHeight: 1.5,
    color: palette.textMuted,
  },

  // Table Styles
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.tableStripe,
  },
  tableTotalRow: {
    backgroundColor: palette.primaryLight,
  },

  // Table Column Styles
  colItems: {
    width: '45%',
    paddingRight: 6,
  },
  colRole: {
    width: '28%',
    paddingRight: 6,
  },
  colHours: {
    width: '12%',
    textAlign: 'right',
    paddingRight: 6,
  },
  colCost: {
    width: '15%',
    textAlign: 'right',
  },
  tableCellText: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: palette.text,
  },
  tableCellTextMuted: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: palette.textMuted,
  },
  tableCellTextBold: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: palette.text,
  },

  // Lists Styles
  listSection: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  deliverablesCard: {
    backgroundColor: palette.deliverableBg,
  },
  assumptionsCard: {
    backgroundColor: palette.assumptionBg,
  },
  listTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    marginBottom: 6,
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listItem: {
    fontSize: 9.5,
    marginBottom: 4,
    lineHeight: 1.45,
    color: palette.text,
  },
  bullet: {
    marginRight: 4,
  },

  // Totals Section Styles
  totalsSection: {
    marginBottom: 28,
    alignItems: 'flex-end',
  },
  grandTotalContainer: {
    minWidth: 180,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  grandTotalLabel: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  grandTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.primaryDark,
    textAlign: 'right',
  },
  grandTotalHint: {
    fontSize: 8.5,
    color: palette.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },

  // Summary Table Styles
  summarySection: {
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: '#FFFFFF',
  },
  summaryRowAlt: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.tableStripe,
  },
  summaryTotalRow: {
    backgroundColor: palette.primaryLight,
  },
  summaryColScope: {
    width: '48%',
    paddingRight: 6,
  },
  summaryColHours: {
    width: '26%',
    textAlign: 'right',
    paddingRight: 6,
  },
  summaryColCost: {
    width: '26%',
    textAlign: 'right',
  },

  // Text Sections
  textSection: {
    marginBottom: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.6,
    color: palette.textMuted,
  },

  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 8,
    color: palette.textMuted,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 8,
  },
});

const sanitizeWeekText = (value?: string | null): string => {
  if (!value) return '';
  return value
    .replace(/\s*\(\s*week[^)]*\)/gi, '')
    .replace(/\s*\(\s*wk[^)]*\)/gi, '')
    .replace(/\s*\(\s*w\d[^)]*\)/gi, '')
    .replace(/\bphase\s*\d+\b/gi, '')
    .replace(/\b\d+\s*-?\s*(?:week|weeks|wk|wks)\b(?:\s*(?:phase|plan))?/gi, '')
    .replace(/\bweek\s*\d+\b/gi, '')
    .replace(/\b(?:three|four|five|six|seven|eight|nine|ten)\s*-?\s*(?:week|weeks)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const SOWPdfExport: React.FC<SOWPdfExportProps> = ({ sowData }) => {
  const {
    company,
    clientName,
    projectTitle,
    projectSubtitle,
    projectOverview,
    budgetNotes,
    scopes,
    currency,
    gstApplicable,
    generatedDate,
  } = sowData;

  const grandTotal = calculateGrandTotal(scopes);
  const totalHours = calculateTotalHours(scopes);
  const logoSource = company.logoUrl?.trim();

  const brandWords = (company.name || '').trim().split(/\s+/).filter(Boolean);
  const brandPrimary = (brandWords.shift() || company.name || '').toUpperCase();
  const brandAccent = brandWords.join(' ').toUpperCase();
  const bannerCopy = (projectSubtitle || projectTitle || '').trim().toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {logoSource ? (
            <Image src={logoSource} style={styles.logo} />
          ) : null}
          {company.name ? (
            <View style={styles.brandNameRow}>
              <Text style={styles.brandNamePrimary}>{brandPrimary}</Text>
              {brandAccent ? (
                <Text style={styles.brandNameAccent}> {brandAccent}</Text>
              ) : null}
            </View>
          ) : null}
          {bannerCopy ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{bannerCopy}</Text>
            </View>
          ) : null}
          {projectTitle ? <Text style={styles.mainTitle}>{projectTitle}</Text> : null}
          {projectSubtitle && projectSubtitle.trim() && projectSubtitle.trim().toUpperCase() !== bannerCopy ? (
            <Text style={styles.subtitle}>{projectSubtitle}</Text>
          ) : null}
          {clientName ? (
            <Text style={styles.clientInfo}>
              <Text style={styles.clientLabel}>Client: </Text>
              {clientName}
            </Text>
          ) : null}
        </View>

        {/* Scopes Section */}
        {scopes.map((scope) => {
          const scopeTitle = sanitizeWeekText(scope.title);
          const scopeDescription = sanitizeWeekText(scope.description);
          const sanitizedDeliverables = (scope.deliverables || [])
            .map(sanitizeWeekText)
            .filter(Boolean);
          const sanitizedAssumptions = (scope.assumptions || [])
            .map(sanitizeWeekText)
            .filter(Boolean);

          return (
            <View key={scope.id} style={styles.scopeSection} wrap={false}>
              {/* Scope Header */}
              <View style={styles.scopeHeader}>
                <Text style={styles.scopeHeaderText}>
                  Scope {scope.id}: {scopeTitle || scope.title}
                </Text>
              </View>

              <View style={styles.scopeBody}>
                {/* Scope Description */}
                {scopeDescription ? (
                  <Text style={styles.scopeDescription}>{scopeDescription}</Text>
                ) : null}

                {/* Items Table */}
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={styles.colItems}>
                      <Text style={styles.tableHeaderText}>Items</Text>
                    </View>
                    <View style={styles.colRole}>
                      <Text style={styles.tableHeaderText}>Role</Text>
                    </View>
                    <View style={styles.colHours}>
                      <Text style={styles.tableHeaderText}>Hours</Text>
                    </View>
                    <View style={styles.colCost}>
                      <Text style={styles.tableHeaderText}>
                        Total Cost{gstApplicable ? ' + GST' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {scope.items.map((item, itemIndex) => {
                    const itemDescription = sanitizeWeekText(item.description);
                    const itemRole = sanitizeWeekText(item.role);
                    const rowStyle = itemIndex % 2 === 1 ? styles.tableRowAlt : styles.tableRow;
                    return (
                      <View key={itemIndex} style={rowStyle}>
                        <View style={styles.colItems}>
                          <Text style={styles.tableCellText}>{itemDescription || item.description}</Text>
                        </View>
                        <View style={styles.colRole}>
                          <Text style={styles.tableCellTextMuted}>{itemRole || item.role}</Text>
                        </View>
                        <View style={styles.colHours}>
                          <Text style={styles.tableCellText}>{item.hours}</Text>
                        </View>
                        <View style={styles.colCost}>
                          <Text style={styles.tableCellTextBold}>
                            {formatCurrency(item.cost, currency)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* Scope Total Row */}
                  <View style={[styles.tableRow, styles.tableTotalRow]}>
                    <View style={styles.colItems}>
                      <Text style={styles.tableCellTextBold}>Scope Total</Text>
                    </View>
                    <View style={styles.colRole}>
                      <Text style={styles.tableCellTextMuted}>—</Text>
                    </View>
                    <View style={styles.colHours}>
                      <Text style={styles.tableCellTextBold}>
                        {calculateScopeHours(scope.items)}
                      </Text>
                    </View>
                    <View style={styles.colCost}>
                      <Text style={styles.tableCellTextBold}>
                        {formatCurrency(calculateScopeTotal(scope.items), currency)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Deliverables */}
                {sanitizedDeliverables.length > 0 && (
                  <View style={[styles.listSection, styles.deliverablesCard]}>
                    <Text style={styles.listTitle}>Deliverables</Text>
                    {sanitizedDeliverables.map((deliverable, index) => (
                      <Text key={index} style={styles.listItem}>
                        <Text style={styles.bullet}>• </Text>
                        {deliverable}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Assumptions */}
                {sanitizedAssumptions.length > 0 && (
                  <View style={[styles.listSection, styles.assumptionsCard]}>
                    <Text style={styles.listTitle}>Assumptions</Text>
                    {sanitizedAssumptions.map((assumption, index) => (
                      <Text key={index} style={styles.listItem}>
                        <Text style={styles.bullet}>• </Text>
                        {assumption}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Grand Total Section */}
        <View style={styles.totalsSection}>
          <View style={styles.grandTotalContainer}>
            <Text style={styles.grandTotalLabel}>Total Project Investment</Text>
            <Text style={styles.grandTotalAmount}>
              {formatCurrency(grandTotal, currency)}
            </Text>
            {gstApplicable ? (
              <Text style={styles.grandTotalHint}>GST not included</Text>
            ) : null}
          </View>
        </View>

        {/* Scope & Price Overview Table */}
        <View style={styles.summarySection} wrap={false}>
          <Text style={styles.summaryTitle}>Scope & Price Overview</Text>
          <View style={styles.summaryTable}>
            {/* Summary Table Header */}
            <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryColScope}>
                <Text style={styles.tableHeaderText}>SCOPE</Text>
              </View>
              <View style={styles.summaryColHours}>
                <Text style={styles.tableHeaderText}>ESTIMATED TOTAL HOURS</Text>
              </View>
              <View style={styles.summaryColCost}>
                <Text style={styles.tableHeaderText}>TOTAL COST</Text>
              </View>
            </View>

            {/* Summary Table Rows */}
            {scopes.map((scope, index) => {
              const summaryRowStyle = index % 2 === 1 ? styles.summaryRowAlt : styles.summaryRow;
              return (
                <View key={scope.id} style={summaryRowStyle}>
                  <View style={styles.summaryColScope}>
                    <Text style={styles.tableCellText}>
                      Scope {scope.id}: {sanitizeWeekText(scope.title) || scope.title}
                    </Text>
                  </View>
                  <View style={styles.summaryColHours}>
                    <Text style={styles.tableCellText}>
                      {calculateScopeHours(scope.items)}
                    </Text>
                  </View>
                  <View style={styles.summaryColCost}>
                    <Text style={styles.tableCellTextBold}>
                      {formatCurrency(calculateScopeTotal(scope.items), currency)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Summary Total Row */}
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <View style={styles.summaryColScope}>
                <Text style={styles.tableCellTextBold}>Total Project</Text>
              </View>
              <View style={styles.summaryColHours}>
                <Text style={styles.tableCellTextBold}>{totalHours}</Text>
              </View>
              <View style={styles.summaryColCost}>
                <Text style={styles.tableCellTextBold}>
                  {formatCurrency(grandTotal, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Overview Section */}
        {projectOverview && (
          <View style={styles.textSection} wrap={false}>
            <Text style={styles.sectionTitle}>Project Overview</Text>
            <Text style={styles.sectionContent}>{projectOverview}</Text>
          </View>
        )}

        {/* Budget Notes Section */}
        {budgetNotes && (
          <View style={styles.textSection} wrap={false}>
            <Text style={styles.sectionTitle}>Budget Notes</Text>
            <Text style={styles.sectionContent}>{budgetNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {company.name} | Generated on {generatedDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default SOWPdfExport;
