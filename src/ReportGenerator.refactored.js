// Regras de negócio que antes apareciam como números mágicos no meio dos ifs.
const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

/**
 * Regras de visibilidade e prioridade por papel do usuário.
 * Substitui a cadeia `if (user.role === 'ADMIN') ... else if (user.role === 'USER')`.
 */
const ROLE_RULES = {
  ADMIN: {
    canSee: () => true,
    isPriority: (item) => item.value > ADMIN_PRIORITY_THRESHOLD,
  },
  USER: {
    canSee: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
    isPriority: () => false,
  },
};

// Papel desconhecido não enxerga nenhum item (mesmo comportamento do original).
const NO_ACCESS_RULES = {
  canSee: () => false,
  isPriority: () => false,
};

/**
 * Formatadores com a mesma interface (header / row / footer).
 * Substitui os `if (reportType === 'CSV') ... else if (reportType === 'HTML')`
 * repetidos no cabeçalho, no corpo e no rodapé (Replace Conditional with Polymorphism).
 */
class CsvFormatter {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormatter {
  header(user) {
    return (
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    );
  }

  row(item, user, isPriority) {
    const style = isPriority ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  footer(total) {
    return '</table>\n' + `<h3>Total: ${total}</h3>\n` + '</body></html>\n';
  }
}

const FORMATTERS = {
  CSV: new CsvFormatter(),
  HTML: new HtmlFormatter(),
};

function sumValues(items) {
  return items.reduce((total, item) => total + item.value, 0);
}

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo (itens acima de 1000 são destacados no HTML).
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      return '';
    }

    const rules = this.rulesFor(user);
    const visibleItems = items.filter((item) => rules.canSee(item));

    const body = visibleItems
      .map((item) => formatter.row(item, user, rules.isPriority(item)))
      .join('');

    const report =
      formatter.header(user) + body + formatter.footer(sumValues(visibleItems));

    return report.trim();
  }

  rulesFor(user) {
    return ROLE_RULES[user.role] ?? NO_ACCESS_RULES;
  }
}
