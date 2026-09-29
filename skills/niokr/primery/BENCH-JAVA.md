# bench-java — JVM baseline for Sigma methodology

> **Назначение.** Параллель к Python-бенчу [`../bench/`](../bench/):
> те же 12 примеров, портированные на Java, измеренные через JMH на
> том же ноутбуке. Результат — **JVM baseline** для методологии
> «Сигма» (родная среда, для которой она и была написана), против
> которого Python-редакция ([`../docs/METHODOLOGY-PYTHON.md`](../docs/METHODOLOGY-PYTHON.md))
> может быть честно сопоставлена.

---

## Контекст (прочитать до старта)

- Методология «Сигма» (Goncharov / Nechesov / Sviridenko, Sobolev
  Institute) изначально сформулирована для Java/JVM. Оригинальные
  правила — в [`../docs/METHODOLOGY.md`](../docs/METHODOLOGY.md).
  Правило 4 (контролируемая рекурсия) уточнено Нечесовым в апреле
  2026: структурный спуск + ограниченный рост `|f(a)| ≤ |a| + c`
  достаточны для класса FP (Cobham / Bellantoni–Cook).
- Python-редакция [`../docs/METHODOLOGY-PYTHON.md`](../docs/METHODOLOGY-PYTHON.md)
  показала, что **правила 1–2 в CPython инвертируются** (ручные
  циклы проигрывают C-написанным built-ins в 30–70×).
- **Гипотеза, проверяемая этим бенчем:** на JVM (родина методологии)
  оригинальные правила работают так, как авторы и закладывали — то
  есть и правила 1–2 либо побеждают, либо хотя бы не проигрывают.
- Существующие Python-результаты — в [`../bench/results/`](../bench/results/).
  Сравнение пройдёт **на этом же ноутбуке**, чтобы железо было одно.

---

## Scope этой задачи

**В scope:**
1. Развернуть `bench-java/` как Maven-проект с JMH.
2. Портировать 12 примеров из [`../bench/src/sigma_bench/examples/`](../bench/src/sigma_bench/examples/)
   на Java (тот же алгоритм, те же N где разумно).
3. Прогнать JMH; результаты — в `bench-java/results/<timestamp>/`
   в формате CSV + JSON.
4. Сгенерировать `bench-java/results/<timestamp>/summary.md` в том
   же формате, что Python-бенч (по примеру: таблица N / slow_ms /
   fast_ms / speedup / verdict).
5. Сделать `start-java.command` (macOS / Linux) и `start-java.bat`
   (Windows) — двойной клик launcher'ы, аналогичные
   [`../start.command`](../start.command) / [`../start.bat`](../start.bat).
6. Добавить `bench-java/.gitignore` (исключить `target/`, `results/`,
   `.idea/`).

**Вне scope (НЕ ДЕЛАТЬ):**
- Не модифицировать ничего в [`../bench/`](../bench/) (Python).
- Не редактировать файлы в `../docs/`, `../agent-rules/`, README,
  start.command / start.bat.
- Не писать кросс-языковой comparison-документ — это произойдёт в
  основном сеансе после возврата результатов.

---

## Prerequisites

- **JDK 17+** (рекомендуется Temurin 21):
  `brew install --cask temurin` на macOS,
  или скачать с <https://adoptium.net/>.
- **Maven 3.8+**: `brew install maven` на macOS.
- JMH подтянется через Maven, отдельно ставить не надо.

Проверка: `java -version` и `mvn -v` должны печатать версии.

---

## Структура директории

```
bench-java/
├── BENCH-JAVA.md                 ← этот файл
├── pom.xml                       ← Maven config + JMH dependency
├── .gitignore                    ← target/ results/ .idea/
├── src/main/java/com/sigma/bench/
│   ├── examples/                 ← 12 классов с @Benchmark методами
│   │   ├── FibonacciBench.java
│   │   ├── FactorialBench.java
│   │   ├── BubbleSortBench.java
│   │   ├── AverageBench.java
│   │   ├── MaxBench.java
│   │   ├── SensorValidationBench.java
│   │   ├── StringConcatBench.java
│   │   ├── SubstringSearchBench.java
│   │   ├── DictBuildBench.java
│   │   ├── GlobalCounterBench.java
│   │   ├── MutatingIterationBench.java
│   │   └── IndexedIterationBench.java
│   ├── Runner.java               ← главный CLI (list / run / all)
│   └── ReportGenerator.java      ← JMH JSON → results.csv + summary.md
└── results/<timestamp>/          ← gitignored
    ├── jmh-result.json           ← сырой JMH output
    ├── results.csv               ← парсенный (формат как в Python)
    └── summary.md                ← per-example таблицы + verdicts
```

---

## pom.xml — ключевые зависимости

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.sigma</groupId>
  <artifactId>bench-java</artifactId>
  <version>0.1.0</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <jmh.version>1.37</jmh.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.openjdk.jmh</groupId>
      <artifactId>jmh-core</artifactId>
      <version>${jmh.version}</version>
    </dependency>
    <dependency>
      <groupId>org.openjdk.jmh</groupId>
      <artifactId>jmh-generator-annprocess</artifactId>
      <version>${jmh.version}</version>
      <scope>provided</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <artifactId>maven-shade-plugin</artifactId>
        <version>3.5.0</version>
        <executions>
          <execution>
            <phase>package</phase>
            <goals><goal>shade</goal></goals>
            <configuration>
              <finalName>benchmarks</finalName>
              <transformers>
                <transformer implementation=
                  "org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                  <mainClass>org.openjdk.jmh.Main</mainClass>
                </transformer>
              </transformers>
            </configuration>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
</project>
```

После `mvn clean package` получаем executable JAR
`target/benchmarks.jar`.

---

## JMH — пример класса (паттерн для всех 12)

```java
package com.sigma.bench.examples;

import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;
import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(1)
@Timeout(time = 30, unit = TimeUnit.SECONDS)
public class FibonacciBench {

    @Param({"10", "20", "25", "30", "32", "34", "36", "38", "40"})
    public int n;

    @Benchmark
    public long slow(Blackhole bh) {
        long result = fibSlow(n);
        bh.consume(result);
        return result;
    }

    @Benchmark
    public long fast(Blackhole bh) {
        long result = fibFast(n);
        bh.consume(result);
        return result;
    }

    private long fibSlow(int n) {
        if (n <= 1) return n;
        return fibSlow(n - 1) + fibSlow(n - 2);   // O(2^n)
    }

    private long fibFast(int n) {
        long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            long t = b;
            b = a + b;
            a = t;
        }
        return a;
    }
}
```

Все остальные примеры — по этому шаблону.

**Обязательно:** `Blackhole.consume(...)` на возвращаемом значении —
иначе HotSpot выкинет вычисление как dead code и числа будут
неинформативными.

---

## 12 примеров — алгоритмы и параметры

Источник истины — Python-код в [`../bench/src/sigma_bench/examples/`](../bench/src/sigma_bench/examples/).
Java-порт должен быть **прямым переводом**, не «улучшенным».

Колонка «Expected verdict» — гипотеза, которую этот пример
проверяет. Если результат совпадает — гипотеза подтверждена; если
расходится — это интересная находка для отчёта.

| # | Example | slow | fast | N | Expected verdict |
|---|---|---|---|---|---|
| 1 | **fibonacci** | naive recursive `fib(n-1)+fib(n-2)` | iterative two-variable swap | 10, 20, 25, 30, 32, 34, 36, 38, 40 | **win-critical** (экспонента vs линейка — language-independent) |
| 2 | **factorial** | recursive `n * factorial(n-1)` | iterative loop with `BigInteger` | 100, 500, 1_000, 5_000, 10_000 | **win** (стек кадров vs итерация); JVM-стек больше Python, но логика сохраняется |
| 3 | **bubble_sort** | recursive | iterative | 100, 500, 1_000, 2_000 | **win** (ограниченный стек) |
| 4 | **average** ⚠ KEY | manual `for (int x : nums) total += x; total / nums.length` | `IntStream.of(nums).average().orElseThrow()` или `Arrays.stream(nums).average()` | 1_000, 10_000, 100_000, 1_000_000 | **tie или mild win for slow** — на JVM HotSpot инлайнит лямбды; Stream имеет некоторый overhead. **Это инверсия Python-результата** — там методология проигрывала ×60 |
| 5 | **max** ⚠ KEY | manual `for` + `if (x > m) m = x` | `IntStream.of(nums).max().orElseThrow()` | 1_000, 10_000, 100_000, 1_000_000 | **tie или mild win for slow** — то же, что average |
| 6 | **sensor_validation** ⚠ KEY | manual `for` + ArrayList<>().add() с фильтром | Stream.filter().collect(toList()) | 1_000, 10_000, 100_000, 1_000_000 | **tie** — Stream и manual обычно в пределах 2× на JVM |
| 7 | **string_concat** | `String s = ""; for (...) s += part;` | explicit `StringBuilder` + `.toString()` | 1_000, 5_000, 10_000, 50_000 | **win** — `+=` на String внутри цикла остаётся O(n²) для общего случая (компилятор не всегда хостит StringBuilder из цикла) |
| 8 | **substring_search** | hand-rolled scan | `String.indexOf(substr)` | 1_000_000, 5_000_000, 10_000_000 (длина haystack) | **win** — `indexOf` JIT-оптимизирован |
| 9 | **dict_build** | manual `for` + `map.put(k, v)` | `IntStream.range(0, N).boxed().collect(Collectors.toMap(...))` | 10_000, 100_000, 1_000_000 | **mild loss или tie** — Stream-collect tax обычно небольшой, но реальный |
| 10 | **global_counter** ⚠ KEY | static field `counter`, recursive фукция инкрементит | parameter passes count через return | 1_000, 10_000, 100_000 | **tie** — статическое поле в JVM по доступу сравнимо с локалью. **Если так — Python-результат (1.8× за счёт LOAD_FAST vs LOAD_GLOBAL) Python-специфичен** |
| 11 | **mutating_iteration** | `for (Item it : list) if (cond) list.remove(it);` | собрать to-remove заранее, потом удалить | 100, 1_000, 10_000 | **win-critical** (slow бросает `ConcurrentModificationException` — DNF на каждом N, тот же урок что в Python с другим именем исключения) |
| 12 | **indexed_iteration** ⚠ KEY | `for (int i = 0; i < items.length; i++) process(items[i])` | enhanced-for: `for (Item x : items) process(x)` | 1_000, 10_000, 100_000, 1_000_000 | **tie** — обе формы идиоматичны в Java, HotSpot опускает их в одинаковый bytecode после прогрева. **Tie здесь напрямую доказывает, что J1 — Python-специфичный антипаттерн, а не универсальный** |

⚠ KEY помечены примеры, чьи результаты **критически важны** для
кросс-языкового сравнения — именно они отвечают на вопрос «работает
ли методология в её родной среде так, как авторы заложили».

---

## Параметры JMH

Базовые значения для всех `@Benchmark` методов:

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations = 3, time = 1)        // 3 секунды прогрева
@Measurement(iterations = 5, time = 1)   // 5 измерений по секунде
@Fork(1)                                 // одна JVM на бенч (быстрее)
@Timeout(time = 30, unit = TimeUnit.SECONDS)
```

Для длинных бенчей (например, `fibonacci.slow` при N=40 — это
секунды реального времени) — оставить `Mode.AverageTime` и
полагаться на `@Timeout` для отсечки.

Для очень быстрых методов (например, `dict_build.fast` при малом N)
— возможно стоит переключить на `Mode.SingleShotTime` и/или
увеличить N.

Документировать любые отклонения от базовых параметров **в
комментарии над `@Benchmark`** — чтобы в notes.md можно было сказать
«я поменял такие-то параметры по такой-то причине».

---

## Запуск

```bash
cd bench-java
mvn -q clean package

# Прогон всего
TS=$(date +%Y-%m-%d-%H%M%S)
mkdir -p results/$TS
java -jar target/benchmarks.jar \
  -rf json -rff results/$TS/jmh-result.json

# Прогон одного примера
java -jar target/benchmarks.jar \
  com.sigma.bench.examples.FibonacciBench \
  -rf json -rff results/$TS/jmh-result.json

# Постобработка: JSON → results.csv + summary.md
java -cp target/benchmarks.jar com.sigma.bench.ReportGenerator \
  results/$TS/jmh-result.json results/$TS
```

Полный прогон 12 примеров займёт **~30–60 минут** на текущем
ноутбуке (3 warmup + 5 measure × ~9 N-параметров × 12 бенчей × 2
варианта ≈ десятки тысяч итераций реального кода).

---

## Формат вывода (должен совпадать с Python-бенчем)

`results.csv` — точно такой же формат, какой генерирует
[`../bench/src/sigma_bench/`](../bench/src/sigma_bench/):

```
example,version,n,t_ms,peak_kb,status
fibonacci,slow,10,0.014,N/A,ok
fibonacci,fast,10,0.009,N/A,ok
fibonacci,slow,40,15938.879,N/A,ok
fibonacci,fast,40,0.022,N/A,ok
mutating_iteration,slow,100,N/A,N/A,error
```

`peak_kb` оставить как `N/A` — JMH по умолчанию не меряет память;
колонка остаётся для format compatibility.

`status` — `ok` если бенч завершился, `error` если бросил исключение
(например `ConcurrentModificationException`), `timeout` если превысил
30 секунд.

`summary.md` — точная зеркальная копия Python-формата:

```markdown
# Sigma benchmark — Java baseline

**Hardware:** <CPU model>, <RAM>, JDK <version>
**Date:** <ISO datetime>

## fibonacci

| N | slow (ms) | fast (ms) | speedup | slow status |
|---:|---:|---:|---:|:---|
| 10 | 0.014 | 0.009 | 1.7× | ok |
| 40 | 15938.879 | 0.022 | 724k× | ok |

**Verdict: win-critical.** Sigma wins decisively (>100× at largest N).

_Сигма выигрывает решительно — ускорение огромное, экспонента vs линейка._

## average

...
```

Verdict-логику (5 категорий: win-critical / win / tie / loss /
loss-strong) брать из
[`../bench/src/sigma_bench/report.py`](../bench/src/sigma_bench/report.py)
и реализовать ту же на Java — те же пороги, та же интерпретация.

---

## Launchers

`start-java.command` (macOS / Linux):

- `cd` в директорию скрипта.
- Проверить `java -version` (≥ 17) и `mvn -v` — если нет,
  напечатать инструкцию по установке и выйти.
- На первом запуске: `mvn clean package`.
- Показать меню (как в Python launcher):
  - 1) Run all 12 examples (~45 minutes)
  - 2) Run fibonacci only
  - 3) Run factorial / bubble_sort
  - 4) Run average / max / sensor_validation (KEY checks)
  - 5) Run string_concat / substring_search / dict_build
  - 6) Run global_counter / mutating_iteration
  - 7) Run indexed_iteration
  - 8) List all examples
  - 9) Open last results folder in Finder/Explorer
  - s) Show last summary.md
  - q) Quit

`start-java.bat` — то же самое для Windows; зеркало
[`../start.bat`](../start.bat) по структуре.

Положить launcher'ы в **корень репозитория** (рядом с
[`../start.command`](../start.command)), не внутри `bench-java/`.

---

## Что вернуть в основной сеанс

После прогона — три файла:

1. `bench-java/results/<timestamp>/results.csv`
2. `bench-java/results/<timestamp>/summary.md`
3. `bench-java/results/<timestamp>/notes.md` — короткие наблюдения:
   - какие примеры удивили (verdict разошёлся с гипотезой);
   - какие N пришлось урезать из-за timeout;
   - какие JMH-параметры подкручивал и почему;
   - любые странности (высокая variance, JIT не сошёлся, что-то ещё);
   - конфигурация железа: CPU, RAM, JDK версия.

В основном сеансе мы дальше:
- Сопоставим Java-числа с Python-числами по каждому из 12 примеров.
- Добавим колонку «Java verdict» в headline-таблицы в
  [`../docs/METHODOLOGY-PYTHON.md`](../docs/METHODOLOGY-PYTHON.md) и
  README.
- Напишем [`../docs/CROSS-LANGUAGE-COMPARISON.md`](../docs/CROSS-LANGUAGE-COMPARISON.md)
  с полной side-by-side таблицей и chart pack'ом.
- Обновим [`../docs/REVIEW.md`](../docs/REVIEW.md) разделом
  «эмпирическое подтверждение через JVM baseline».
- Возможно — переименуем `../docs/METHODOLOGY.md` →
  `../docs/METHODOLOGY-JAVA.md` для симметрии с PYTHON / FRONTEND
  редакциями.

---

## Hard rules

- **Не трогать Python-бенч** ([`../bench/`](../bench/)) ни в каком
  виде.
- **Не трогать методологию / agent-rules / docs / README** —
  обновления туда внесёт основной сеанс после возврата результатов.
- Прогон **на том же ноутбуке** что и Python-бенч; зафиксировать
  железо/JDK в `notes.md`.
- Если бенч превышает 30s — `@Timeout` отсекает; зафиксировать
  максимальное N, на котором ещё успевает уложиться, и записать в
  `notes.md`.
- Если JMH сообщает о высокой variance или JIT не сходится —
  задокументировать, не «сглаживать» молча.
- Никаких микрооптимизаций slow-варианта чтобы он «лучше выглядел».
  slow — это методология-нарушающий код в чистом виде; он **должен**
  быть наивным.

---

## Как запустить этот бриф

1. Открыть свежее окно VS Code в корне репозитория `POLINOM/`.
2. Запустить новый сеанс Claude Code в этом окне.
3. Дать агенту такой промпт:

> «Прочитай `bench-java/BENCH-JAVA.md` и выполни описанную там
> работу end-to-end. Остановись на пункте `Что вернуть в основной
> сеанс`. Не модифицируй ничего за пределами `bench-java/` и двух
> новых launcher-файлов в корне репозитория (`start-java.command`,
> `start-java.bat`).»

После завершения — вернуться в основной сеанс с тремя файлами из
`bench-java/results/<timestamp>/` и сообщением «бенч прогнался,
результаты вот».
